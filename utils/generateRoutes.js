import fs from 'fs';
import path from 'path';
const filePath = path.join(process.cwd(), 'types.d.ts');
	
export async function generateRoutes() {
    if (fs.existsSync(filePath)) {
  // Chemin vers le fichier types.d.ts (à adapter selon votre structure)
  
  const typesFilePath = path.join(process.cwd(), 'types.d.ts');
  
  // Lire le contenu du fichier types.d.ts

  const typesContent = fs.readFileSync(typesFilePath, 'utf-8');

  // Extraire les noms des types (supposons qu'ils soient définis comme `type TypeName = ...`)

  const typeNames = typesContent.match(/type (\w+)/g).map(match => match.split(' ')[1]);

  // Chemin vers le dossier src/app/api
  const apiDirPath = path.join(process.cwd(), 'src', 'app', 'api');

  // Créer le dossier src/app/api s'il n'existe pas
  if (!fs.existsSync(apiDirPath)) {
    fs.mkdirSync(apiDirPath, { recursive: true });
  }

  // Créer un dossier pour chaque type
  typeNames.forEach(typeName => {
    const pluralTypeName = typeName.toLowerCase() + 's'; // Pluriel en minuscule
    const typeDirPath = path.join(apiDirPath, pluralTypeName);

    if (!fs.existsSync(typeDirPath)) {
      fs.mkdirSync(typeDirPath);
    }

    // Créer un fichier route.ts dans chaque dossier avec les méthodes de fetching
    const routeFilePath = path.join(typeDirPath, 'route.ts');
    if (!fs.existsSync(routeFilePath)) {
      const routeContent = generateRouteContent(typeName);
      fs.writeFileSync(routeFilePath, routeContent);
      console.log(`Fichier ${routeFilePath} créé avec succès !`);
    }
  });

  console.log('Opération terminée !');
}

function generateRouteContent(typeName) {
  return `
import { NextResponse } from 'next/server';

const DATA_SOURCE_URL = 'https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s';
const API_KEY: string = process.env.DATA_API_KEY as string;

export async function GET() {
  try {
    const res = await fetch(DATA_SOURCE_URL);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.error('Failed to fetch data', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(DATA_SOURCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, 201);
  } catch (error) {
    console.error('Error creating data:', error);
    return NextResponse.error('Failed to create data', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(\`\${DATA_SOURCE_URL}/\${body.id}\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.error('Failed to update data', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await fetch(\`\${DATA_SOURCE_URL}/\${id}\`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': API_KEY,
      },
    });
    return NextResponse.json({ message: \`Data with id \${id} deleted\` });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.error('Failed to delete data', 500);
  }
}
`;
}
}
generateRoutes();
