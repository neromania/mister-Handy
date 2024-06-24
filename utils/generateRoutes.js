import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const filePath = path.join(process.cwd(), 'types.d.ts');

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateRouteContent(typeName) {
  return `
import axios from 'axios';

const API_URL = 'https://jsonplaceholder.typicode.com/${typeName.toLowerCase()}s';

export const get${typeName}s = async (): Promise<Post[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const get${typeName} = async (id: number): Promise<Post> => {
  const response = await axios.get(\`\${API_URL}/\${id}\`);
  return response.data;
};

export const create${typeName} = async (post: Omit<Post, 'id'>): Promise<Post> => {
  const response = await axios.post(API_URL, post);
  return response.data;
};

export const update${typeName} = async (id: number, post: Omit<Post, 'id'>): Promise<Post> => {
  const response = await axios.put(\`\${API_URL}/\${id}\`, post);
  return response.data;
};

export const delete${typeName} = async (id: number): Promise<void> => {
  await axios.delete(\`\${API_URL}/\${id}\`);
};
`;
}

export async function generateRoutes() {
  if (fs.existsSync(filePath)) {
    const typesContent = fs.readFileSync(filePath, 'utf-8');
    const typeNames = typesContent.match(/type (\w+)/g)?.map(match => match.split(' ')[1]) || [];
    const apiDirPath = path.join(process.cwd(), 'src', 'app', 'api');

    if (!fs.existsSync(apiDirPath)) {
      fs.mkdirSync(apiDirPath, { recursive: true });
    }

    const { chosenType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosenType',
        message: 'Which type do you want to use for CRUD?',
        choices: typeNames,
      },
    ]);

    const capitalizedTypeName = capitalizeFirstLetter(chosenType);
    const pluralTypeName = capitalizedTypeName.toLowerCase() + 's';
    const typeDirPath = path.join(apiDirPath, pluralTypeName);

    if (!fs.existsSync(typeDirPath)) {
      fs.mkdirSync(typeDirPath, { recursive: true });
    }

    const routeFilePath = path.join(typeDirPath, 'route.ts');
    if (!fs.existsSync(routeFilePath)) {
      const routeContent = generateRouteContent(capitalizedTypeName);
      fs.writeFileSync(routeFilePath, routeContent);
      console.log(`File ${routeFilePath} successfully created for type ${capitalizedTypeName}!`);
    }

    console.log('Operation completed!');
  }
}

// Remove the direct call to generateRoutes()
// generateRoutes();
