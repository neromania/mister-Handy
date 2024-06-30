import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const filePath = path.join(process.cwd(), 'types.d.ts');

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateDynamicRouteContent(typeName, properties) {
  const propDisplay = properties.map(function(prop) {
    const key = prop.split(':').map(function(p) {
      return p.trim();
    })[0];
    return '<p>{' + typeName.toLowerCase() + '.' + key + '}</p>';
  }).join('\n      ');

  return `
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { get${typeName}, delete${typeName} } from '@/app/api/${typeName.toLowerCase()}s/route';

function ${typeName}Detail({ params }) {
  const [${typeName.toLowerCase()}, set${typeName}] = useState(null);
  const router = useRouter();

  useEffect(function() {
    async function fetch${typeName}() {
      const data = await get${typeName}(Number(params.id));
      set${typeName}(data);
    }

    fetch${typeName}();
  }, [params.id]);

  async function handleDelete() {
    if (${typeName.toLowerCase()}) {
      await delete${typeName}(Number(${typeName.toLowerCase()}.id));
      router.push('/');
    }
  }

  if (!${typeName.toLowerCase()}) return <div>Loading...</div>;

  return (
    <div>
      <h1>${typeName.toLowerCase()}s</h1>
      ${propDisplay}
      <button onClick={handleDelete}>Delete</button>
      <button onClick={function() { router.push('/${typeName.toLowerCase()}s/' + ${typeName.toLowerCase()}.id + '/edit'); }}>Edit</button>
    </div>
  );
}

export default ${typeName}Detail;
`;
}


function generateIndexPageContent(typeName, properties) {
  const propDisplay = properties.map(function(prop) {
    const parts = prop.split(':').map(function(p) {
      return p.trim();
    });
    const key = parts[0];
    return `<td className="border px-4 py-2">{renderProperty(${typeName.toLowerCase()}, '${key}')}</td>`;
  }).join('\n              ');

  return `
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { get${typeName}s } from '@/app/api/${typeName.toLowerCase()}s/route';

function ${typeName}sPage() {
  const [${typeName.toLowerCase()}s, set${typeName}s] = useState<${typeName}[]>([]);

  useEffect(() => {
    async function fetch${typeName}s() {
      const ${typeName.toLowerCase()}sData = await get${typeName}s();
      set${typeName}s(${typeName.toLowerCase()}sData);
    }

    fetch${typeName}s();
  }, []);

  function renderProperty<T>(item: T, key: keyof T) {
    const value = item[key];
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((subItem, index) => (
            <li key={index}>{subItem}</li>
          ))}
        </ul>
      );
    }
    return <>{value}</>;
  }

  return (
    <div>
      <h1>${typeName}s</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="border px-4 py-2">ID</th>
            ${properties.map(function(prop) {
              const key = prop.split(':').map(function(p) {
                return p.trim();
              })[0];
              return `<th className="border px-4 py-2">${key}</th>`;
            }).join('\n            ')}
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {${typeName.toLowerCase()}s.map(function(${typeName.toLowerCase()}) {
            return (
              <tr key={${typeName.toLowerCase()}.id}>
                <td className="border px-4 py-2">{${typeName.toLowerCase()}.id}</td>
                ${propDisplay}
                <td className="border px-4 py-2">
                  <Link href={'/${typeName.toLowerCase()}s/' + ${typeName.toLowerCase()}.id}>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Details</button>
                  </Link>
                  <Link href={'/${typeName.toLowerCase()}s/' + ${typeName.toLowerCase()}.id + '/edit'}>
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Edit</button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Link href="/${typeName.toLowerCase()}s/create">
        <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4">Create New ${typeName}</button>
      </Link>
    </div>
  );
}

export default ${typeName}sPage;
`;
}


function generateCreatePageContent(typeName, properties) {
  const propInputs = properties.map(function(prop) {
    const parts = prop.split(':').map(function(p) {
      return p.trim();
    });
    const key = parts[0];
    const type = parts[1];
    if (type === 'string') {
      return '<input type="text" placeholder="' + key + '" value={' + key + '} onChange={function(e) { set' + capitalizeFirstLetter(key) + '(e.target.value); }} />';
    } else if (type === 'number') {
      return '<input type="number" placeholder="' + key + '" value={' + key + '} onChange={function(e) { set' + capitalizeFirstLetter(key) + '(Number(e.target.value)); }} />';
    } else if (type === 'string[]') {
      return '<input type="text" placeholder="' + key + '" value={' + key + '.join(\',\')} onChange={function(e) { set' + capitalizeFirstLetter(key) + '(e.target.value.split(\',\')); }} />';
    } else {
      return '<input type="text" placeholder="' + key + '" value={' + key + '} onChange={function(e) { set' + capitalizeFirstLetter(key) + '(e.target.value); }} />';
    }
  }).join('\n        ');

  const propStates = properties.map(function(prop) {
    const parts = prop.split(':').map(function(p) {
      return p.trim();
    });
    const key = parts[0];
    const type = parts[1];
    if (type === 'string') {
      return 'const [' + key + ', set' + capitalizeFirstLetter(key) + '] = useState<string>(\'\');';
    } else if (type === 'number') {
      return 'const [' + key + ', set' + capitalizeFirstLetter(key) + '] = useState<number>(0);';
    } else if (type === 'string[]') {
      return 'const [' + key + ', set' + capitalizeFirstLetter(key) + '] = useState<string[]>([]);';
    } else {
      return 'const [' + key + ', set' + capitalizeFirstLetter(key) + '] = useState<string>(\'\');';
    }
  }).join('\n  ');

  const propValues = properties.map(function(prop) {
    const key = prop.split(':').map(function(p) {
      return p.trim();
    })[0];
    return key;
  }).join(', ');

  return `
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { create${typeName} } from '@/app/api/${typeName.toLowerCase()}s/route';

function Create${typeName}() {
  ${propStates}
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    await create${typeName}({ ${propValues} });
    router.push('/${typeName.toLowerCase()}s');
  }

  return (
    <div>
      <h1>Create ${typeName}</h1>
      <form onSubmit={handleSubmit}>
        ${propInputs}
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default Create${typeName};
`;
}

function generateEditPageContent(typeName, properties) {
  const propInputs = properties.map(function(prop) {
    const parts = prop.split(':').map(function(p) {
      return p.trim();
    });
    const key = parts[0];
    const type = parts[1];
    if (type === 'string') {
      return `<input type="text" placeholder="${key}" value={${key}} onChange={(e) => set${capitalizeFirstLetter(key)}(e.target.value)} />`;
    } else if (type === 'number') {
      return `<input type="number" placeholder="${key}" value={${key}} onChange={(e) => set${capitalizeFirstLetter(key)}(Number(e.target.value))} />`;
    } else if (type === 'string[]') {
      return `<input type="text" placeholder="${key}" value={${key}.join(',')} onChange={(e) => set${capitalizeFirstLetter(key)}(e.target.value.split(','))} />`;
    } else {
      return `<input type="text" placeholder="${key}" value={${key}} onChange={(e) => set${capitalizeFirstLetter(key)}(e.target.value)} />`;
    }
  }).join('\n        ');

  const propStates = properties.map(function(prop) {
    const parts = prop.split(':').map(function(p) {
      return p.trim();
    });
    const key = parts[0];
    const type = parts[1];
    if (type === 'string') {
      return `const [${key}, set${capitalizeFirstLetter(key)}] = useState<string>('');`;
    } else if (type === 'number') {
      return `const [${key}, set${capitalizeFirstLetter(key)}] = useState<number>(0);`;
    } else if (type === 'string[]') {
      return `const [${key}, set${capitalizeFirstLetter(key)}] = useState<string[]>([]);`;
    } else {
      return `const [${key}, set${capitalizeFirstLetter(key)}] = useState<string>('');`;
    }
  }).join('\n  ');

  const propValues = properties.map(function(prop) {
    const key = prop.split(':').map(function(p) {
      return p.trim();
    })[0];
    return key;
  }).join(', ');

  return `
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { get${typeName}, update${typeName} } from '@/app/api/${typeName.toLowerCase()}s/route';

interface Params {
  [key: string]: string;
}

function Edit${typeName}() {
  ${propStates}
  const [${typeName.toLowerCase()}, set${typeName}] = useState<${typeName} | null>(null);
  const router = useRouter();
  const params = useParams<Params>();

  useEffect(() => {
    if (params.id) {
      get${typeName}(Number(params.id)).then((data) => {
        set${typeName}(data);
        ${properties.map(function(prop) {
          const parts = prop.split(':').map(function(p) {
            return p.trim();
          });
          const key = parts[0];
          const type = parts[1];
          if (type === 'string') {
            return `set${capitalizeFirstLetter(key)}(data.${key});`;
          } else if (type === 'number') {
            return `set${capitalizeFirstLetter(key)}(Number(data.${key}));`;
          } else if (type === 'string[]') {
            return `set${capitalizeFirstLetter(key)}(data.${key});`;
          } else {
            return `set${capitalizeFirstLetter(key)}(data.${key});`;
          }
        }).join('\n        ')}
      });
    }
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (${typeName.toLowerCase()}) {
      await update${typeName}(Number(${typeName.toLowerCase()}.id), { ${propValues} });
      router.push('/${typeName.toLowerCase()}s');
    }
  }

  if (!${typeName.toLowerCase()}) return <div>Loading...</div>;

  return (
    <div>
      <h1>Edit ${typeName}</h1>
      <form onSubmit={handleSubmit}>
        ${propInputs}
        <button type="submit">Update</button>
      </form>
    </div>
  );
}

export default Edit${typeName};
`;
}


export async function generatePages() {
  if (fs.existsSync(filePath)) {
    const typesContent = fs.readFileSync(filePath, 'utf-8');
    const typeNames = typesContent.match(/type (\w+)/g).map(function(match) {
      return match.split(' ')[1];
    }) || [];
    const appDirPath = path.join(process.cwd(), 'src', 'app');

    if (!fs.existsSync(appDirPath)) {
      fs.mkdirSync(appDirPath, { recursive: true });
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosenType',
        message: 'Which type do you want to use for CRUD?',
        choices: typeNames,
      },
    ]);

    const chosenType = answers.chosenType;
    const capitalizedTypeName = capitalizeFirstLetter(chosenType);
    const pluralTypeName = capitalizedTypeName.toLowerCase() + 's';
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
      const properties = typesContent.match(new RegExp('type ' + chosenType + ' = {([^}]*)}', 's'))[1].trim().split('\n').map(function(line) {
        return line.trim();
      });
      const dynamicRouteContent = generateDynamicRouteContent(capitalizedTypeName, properties);
      fs.writeFileSync(dynamicRouteFilePath, dynamicRouteContent);
      console.log('File ' + dynamicRouteFilePath + ' successfully created for type ' + capitalizedTypeName + '!');
    }

    const indexFilePath = path.join(typeDirPath, 'page.tsx');
    if (!fs.existsSync(indexFilePath)) {
      const properties = typesContent.match(new RegExp('type ' + chosenType + ' = {([^}]*)}', 's'))[1].trim().split('\n').map(function(line) {
        return line.trim();
      });
      const indexContent = generateIndexPageContent(capitalizedTypeName, properties);
      fs.writeFileSync(indexFilePath, indexContent);
      console.log('File ' + indexFilePath + ' successfully created for type ' + capitalizedTypeName + '!');
    }

    const createDirPath = path.join(typeDirPath, 'create');
    if (!fs.existsSync(createDirPath)) {
      fs.mkdirSync(createDirPath, { recursive: true });
    }

    const createFilePath = path.join(createDirPath, 'page.tsx');
    if (!fs.existsSync(createFilePath)) {
      const properties = typesContent.match(new RegExp('type ' + chosenType + ' = {([^}]*)}', 's'))[1].trim().split('\n').map(function(line) {
        return line.trim();
      });
      const createContent = generateCreatePageContent(capitalizedTypeName, properties);
      fs.writeFileSync(createFilePath, createContent);
      console.log('File ' + createFilePath + ' successfully created for type ' + capitalizedTypeName + '!');
    }

    const editDirPath = path.join(dynamicRouteDirPath, 'edit');
    if (!fs.existsSync(editDirPath)) {
      fs.mkdirSync(editDirPath, { recursive: true });
    }

    const editFilePath = path.join(editDirPath, 'page.tsx');
    if (!fs.existsSync(editFilePath)) {
      const properties = typesContent.match(new RegExp('type ' + chosenType + ' = {([^}]*)}', 's'))[1].trim().split('\n').map(function(line) {
        return line.trim();
      });
      const editContent = generateEditPageContent(capitalizedTypeName, properties);
      fs.writeFileSync(editFilePath, editContent);
      console.log('File ' + editFilePath + ' successfully created for type ' + capitalizedTypeName + '!');
    }

    console.log('Operation completed!');
  }
}
