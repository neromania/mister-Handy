import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'types.d.ts');

function generateDynamicRouteContent(typeName) {
  return `
import get${typeName}ById from '@/lib/${typeName}/get${typeName}ById';

type Params = {
  params: {
    id: string;
  };
};

export default async function ${typeName}Page({ params: { id } }: Params) {
  const ${typeName.toLowerCase()}Data: ${typeName} = await get${typeName}ById(id);

  return (
    <>
        <h1>Détails de ${typeName}</h1>
        <p>ID: {${typeName.toLowerCase()}Data.id}</p>
        <p>Nom: {${typeName.toLowerCase()}Data.name}</p>
    </>
  );
}
`;
}

export async function generatePages() {
  if (fs.existsSync(filePath)) {
    const typesContent = fs.readFileSync(filePath, 'utf-8');
    const typeNames = typesContent.match(/type (\w+)/g)?.map(match => match.split(' ')[1]) || [];
    const appDirPath = path.join(process.cwd(), 'src', 'app');

    if (!fs.existsSync(appDirPath)) {
      fs.mkdirSync(appDirPath, { recursive: true });
    }

    typeNames.forEach(typeName => {
      const pluralTypeName = typeName.toLowerCase() + 's';
      const typeDirPath = path.join(appDirPath, pluralTypeName);

      if (!fs.existsSync(typeDirPath)) {
        fs.mkdirSync(typeDirPath, { recursive: true });
      }

      const dynamicRouteDirPath = path.join(typeDirPath, '[id]');
      if (!fs.existsSync(dynamicRouteDirPath)) {
        fs.mkdirSync(dynamicRouteDirPath, { recursive: true });
      }

      const dynamicRouteFilePath = path.join(dynamicRouteDirPath, 'page.tsx');
      if (!fs.existsSync(dynamicRouteFilePath)) {
        const dynamicRouteContent = generateDynamicRouteContent(typeName);
        fs.writeFileSync(dynamicRouteFilePath, dynamicRouteContent);
        console.log(`Fichier ${dynamicRouteFilePath} créé avec succès !`);
      }

      const indexFilePath = path.join(typeDirPath, 'page.tsx');
      if (!fs.existsSync(indexFilePath)) {
        const indexContent = generateIndexPageContent(typeName, typesContent);
        fs.writeFileSync(indexFilePath, indexContent);
        console.log(`Fichier ${indexFilePath} créé avec succès !`);
      }
    });

    console.log('Opération terminée !');
  }
}

function generateIndexPageContent(typeName, typesContent) {
  const idKey = extractIdKey(typeName, typesContent);
  return `
import type { Metadata } from 'next';
import getAll${typeName}s from '@/lib/${typeName}/getAll${typeName}s';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${typeName}s',
};

export default async function ${typeName}sPage() {
  const ${typeName.toLowerCase()}sData: Promise<${typeName}[]> = getAll${typeName}s();
  const ${typeName.toLowerCase()}s = await ${typeName.toLowerCase()}sData;

 const content = (
    <section>
      <h2>
        <Link href="/">Back to Home</Link>
      </h2>
      <br />
      {${typeName.toLowerCase()}s.map(${typeName.toLowerCase()} => (
        <div key={${typeName.toLowerCase()}.${idKey}}>
          <p>
            <Link href={\`/${typeName.toLowerCase()}s/\${${typeName.toLowerCase()}.${idKey}}\`}>
              {${typeName.toLowerCase()}.name}
            </Link>
          </p>
          <br />
        </div>
      ))}
    </section>
  );
  return content;
}
`;
}

function extractIdKey(typeName, typesContent) {
  const typeRegex = new RegExp(`type ${typeName} = {([^}]*)}`, 's');
  const match = typesContent.match(typeRegex);
  if (match) {
    const typeDefinition = match[1];
    const idMatch = typeDefinition.match(/(\w+): number;/);
    if (idMatch) {
      return idMatch[1];
    }
  }
  return 'id';
}

generatePages();
