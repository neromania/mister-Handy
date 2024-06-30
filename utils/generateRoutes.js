import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const filePath = path.join(process.cwd(), 'types.d.ts');
console.log(filePath);
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateRouteContent(typeName, properties) {
  if (!properties) {
    throw new Error('Properties is undefined');
  }

  const propNames = properties.map(prop => prop.split(':')[0].trim()).join(', ');
  const postProps = properties.filter(prop => !prop.includes('id')).map(prop => prop.split(':')[0].trim()).join(', ');
  const propTypes = properties.map(prop => prop.split(':').map(p => p.trim()).join(': '));

  const dynamicType = properties.map(prop => {
    const [key, type] = prop.split(':').map(p => p.trim());
    return `${key}: ${type}`;
  }).join('\n  ');

  return `
const API_URL = \`\${process.env.NEXT_PUBLIC_API_URL}/${typeName.toLowerCase()}s\`;

export type ${typeName} = {
  ${dynamicType}
};

export const get${typeName}s = async (): Promise<${typeName}[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const get${typeName} = async (id: number): Promise<${typeName}> => {
  const response = await fetch(\`\${API_URL}/\${id}\`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const create${typeName} = async (${typeName.toLowerCase()}: Omit<${typeName}, 'id'>): Promise<${typeName}> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(${typeName.toLowerCase()}),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const update${typeName} = async (id: number, ${typeName.toLowerCase()}: Omit<${typeName}, 'id'>): Promise<${typeName}> => {
  const response = await fetch(\`\${API_URL}/\${id}\`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(${typeName.toLowerCase()}),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const delete${typeName} = async (id: number): Promise<void> => {
  const response = await fetch(\`\${API_URL}/\${id}\`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
};
`;
}

export async function generateRoutes() {
  if (fs.existsSync(filePath)) {
    const typesContent = fs.readFileSync(filePath, 'utf-8');
    const typeMatches = typesContent.match(/type (\w+) = {([^}]+)}/g) || [];
    const types = typeMatches.map(match => {
      const [, typeName, properties] = match.match(/type (\w+) = {([^}]+)}/);
      return { typeName, properties: properties.trim().split('\n').map(prop => prop.trim()) };
    });

    const apiDirPath = path.join(process.cwd(), 'src', 'app', 'api');

    if (!fs.existsSync(apiDirPath)) {
      fs.mkdirSync(apiDirPath, { recursive: true });
    }

    const { chosenType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosenType',
        message: 'Which type do you want to use for CRUD?',
        choices: types.map(type => type.typeName),
      },
    ]);

    const selectedType = types.find(type => type.typeName === chosenType);
    const capitalizedTypeName = capitalizeFirstLetter(selectedType.typeName);
    const pluralTypeName = capitalizedTypeName.toLowerCase() + 's';
    const typeDirPath = path.join(apiDirPath, pluralTypeName);

    if (!fs.existsSync(typeDirPath)) {
      fs.mkdirSync(typeDirPath, { recursive: true });
    }

    const routeFilePath = path.join(typeDirPath, 'route.ts');
    if (!fs.existsSync(routeFilePath)) {
      const routeContent = generateRouteContent(capitalizedTypeName, selectedType.properties);
      fs.writeFileSync(routeFilePath, routeContent);
      console.log(`File ${routeFilePath} successfully created for type ${capitalizedTypeName}!`);
    }

    console.log('Operation completed!');
  }
}
