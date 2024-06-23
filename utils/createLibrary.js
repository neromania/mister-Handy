import fs from 'fs';
import path from 'path';

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to find foreign keys in type definitions
function findForeignKeys(typeContent) {
  const foreignKeys = [];
  const lines = typeContent.split('\n');
  lines.forEach(line => {
    const match = line.match(/(\w+Id): number;/);
    if (match) {
      foreignKeys.push(match[1]);
    }
  });
  return foreignKeys;
}

export async function createLibrary() {
  const typesFilePath = path.join(process.cwd(), 'types.d.ts');
  const srcDirPath = path.join(process.cwd(), 'src');
  const libDirPath = path.join(srcDirPath, 'lib');
  
  // Créer le dossier src s'il n'existe pas
  if (!fs.existsSync(srcDirPath)) {
    fs.mkdirSync(srcDirPath);
  }
  
  // Créer le dossier lib s'il n'existe pas
  if (!fs.existsSync(libDirPath)) {
    fs.mkdirSync(libDirPath);
  }
  if (!fs.existsSync(typesFilePath)) {
    console.error(`The file ${typesFilePath} does not exist.`);
    return;
  }

  const typesContent = fs.readFileSync(typesFilePath, 'utf8');
  const typeNames = typesContent.match(/type (\w+) =/g)?.map(typeLine => typeLine.split(' ')[1]) || [];

  typeNames.forEach(typeName => {
    const capitalizedTypeName = capitalizeFirstLetter(typeName);
    const typeDirPath = path.join(libDirPath, capitalizedTypeName);
    if (!fs.existsSync(typeDirPath)) {
      fs.mkdirSync(typeDirPath);
    }

    // Extract keys for this type
    const typeRegex = new RegExp(`type ${typeName} = {\\n([\\s\\S]*?)\\n};`, 'g');
    const match = typeRegex.exec(typesContent);
    if (match) {
      const keysContent = match[1];
      const foreignKeys = findForeignKeys(keysContent);
      // Filter out invalid keys and find id key
      const keys = keysContent.split('\n')
        .map(line => line.trim().split(':')[0])
        .filter(key => key.match(/^\w+$/));
      const idKey = keys.find(key => key.toLowerCase() === 'id' || key.toLowerCase().includes('id'));

      // Generate methods for each foreign key found
      foreignKeys.forEach(foreignKey => {
        const relatedTypeName = foreignKey.replace(/Id$/, '');
        const methodName = `get${capitalizeFirstLetter(typeName)}sBy${capitalizeFirstLetter(relatedTypeName)}`;
        let methodContent = `export async function ${methodName}(${foreignKey}: number) {\n`;
        methodContent += `  const res = await fetch('https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s?${foreignKey}=' + ${id});\n`;
        methodContent += `  if (!res.ok) throw new Error("Failed to fetch ${typeName.toLowerCase()}s for ${relatedTypeName} with id " + ${foreignKey});\n`;
        methodContent += `  return res.json();\n`;
        methodContent += `}\n`;
        fs.writeFileSync(path.join(typeDirPath, `${methodName}.ts`), methodContent);

        // Générer la méthode inverse dans le dossier du type lié
        const relatedTypeDirPath = path.join(libDirPath, capitalizeFirstLetter(relatedTypeName));
        if (!fs.existsSync(relatedTypeDirPath)) {
          fs.mkdirSync(relatedTypeDirPath);
        }

        const inverseMethodName = `get${capitalizeFirstLetter(relatedTypeName)}${capitalizeFirstLetter(typeName)}s`;
        let inverseMethodContent = `export async function ${inverseMethodName}(${idKey}: number) {\n`;
        inverseMethodContent += `  const res = await fetch('https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s?${idKey}=' + ${idKey});\n`;
        inverseMethodContent += `  if (!res.ok) throw new Error("Failed to fetch ${typeName.toLowerCase()}s for ${relatedTypeName} with id " + ${idKey});\n`;
        inverseMethodContent += `  return res.json();\n`;
        inverseMethodContent += `}\n`;
        fs.writeFileSync(path.join(relatedTypeDirPath, `${inverseMethodName}.ts`), inverseMethodContent);
      });

      // Create getAll method
      const getAllTypeNames = `getAll${capitalizeFirstLetter(typeName)}s`;
      let getAllContent = `export default async function ${getAllTypeNames}() {\n`;
      getAllContent += `  const res = await fetch('https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s');\n`;
      getAllContent += `  if (!res.ok) throw new Error("Failed to fetch ${typeName.toLowerCase()}s");\n`;
      getAllContent += `  return res.json();\n`;
      getAllContent += `}\n`;
      fs.writeFileSync(path.join(typeDirPath, `${getAllTypeNames}.ts`), getAllContent);

      // Create get/set method only if an 'id' key exists
      if (idKey) {
        const getTypeNames = `get${capitalizeFirstLetter(typeName)}ById`;
        let getContent = `export default async function ${getTypeNames}(${idKey}: string) {\n`;
        getContent += `  const res = await fetch('https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s/' + ${idKey});\n`;
        getContent += `  if (!res.ok) throw new Error("Failed to fetch ${typeName.toLowerCase()} with id " + ${idKey});\n`;
        getContent += `  return res.json();\n`;
        getContent += `}\n`;
        fs.writeFileSync(path.join(typeDirPath, `${getTypeNames}.ts`), getContent);

        const setTypeNames = `set${capitalizeFirstLetter(typeName)}ById`;
        let setContent = `export default async function ${setTypeNames}(${idKey}: string) {\n`;
        setContent += `  const res = await fetch('https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s/' + ${idKey});\n`;
        setContent += `  if (!res.ok) throw new Error("Failed to fetch ${typeName.toLowerCase()} with id " + ${idKey});\n`;
        setContent += `  return res.json();\n`;
        setContent += `}\n`;
        fs.writeFileSync(path.join(typeDirPath, `${setTypeNames}.ts`), setContent);
      }
    }
  });

  console.log(`Library created in: ${libDirPath}`);
}
