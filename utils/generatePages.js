import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const filePath = path.join(process.cwd(), 'types.d.ts');

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateDynamicRouteContent(typeName) {
  return `
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { get${typeName}, delete${typeName} } from '@/app/api/${typeName.toLowerCase()}s/route';

const ${typeName}Detail = ({ params }: { params: { id: string } }) => {
  const [${typeName.toLowerCase()}, set${typeName}] = useState<${typeName} | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetch${typeName} = async () => {
      const data = await get${typeName}(Number(params.id));
      set${typeName}(data);
    };

    fetch${typeName}();
  }, [params.id]);

  const handleDelete = async () => {
    if (${typeName.toLowerCase()}) {
      await delete${typeName}(Number(${typeName.toLowerCase()}.id));
      router.push('/');
    }
  };

  if (!${typeName.toLowerCase()}) return <div>Loading...</div>;

  return (
    <div>
      <h1>{${typeName.toLowerCase()}.title}</h1>
      <p>{${typeName.toLowerCase()}.body}</p>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={() => router.push(\`/${typeName.toLowerCase()}s/\${${typeName.toLowerCase()}.id}/edit\`)}>Edit</button>
    </div>
  );
};

export default ${typeName}Detail;
`;
}

function generateIndexPageContent(typeName) {
  return `
import Link from 'next/link';
import { get${typeName}s } from '@/app/api/${typeName.toLowerCase()}s/route';

const ${typeName}sPage = async () => {
  const ${typeName.toLowerCase()}s: Post[] = await get${typeName}s();

  return (
    <div>
      <h1>${typeName}s</h1>
      <ul>
        {${typeName.toLowerCase()}s.map((post) => (
          <li key={post.id}>
            <Link href={\`/${typeName.toLowerCase()}s/\${post.id}\`}>
              <p>{post.title}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/${typeName.toLowerCase()}s/create">
        <p>Create New ${typeName}</p>
      </Link>
    </div>
  );
};

export default ${typeName}sPage;
`;
}

function generateCreatePageContent(typeName) {
  return `
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { create${typeName} } from '@/app/api/${typeName.toLowerCase()}s/route';

const Create${typeName} = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create${typeName}({ title, body, userId: 1 });
    router.push('/${typeName.toLowerCase()}s');
  };

  return (
    <div>
      <h1>Create ${typeName}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default Create${typeName};
`;
}

function generateEditPageContent(typeName) {
  return `
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { get${typeName}, update${typeName} } from '@/app/api/${typeName.toLowerCase()}s/route';

const Edit${typeName} = () => {
  const [${typeName.toLowerCase()}, set${typeName}] = useState<${typeName} | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      get${typeName}(Number(id)).then((data) => {
        set${typeName}(data);
        setTitle(data.title);
        setBody(data.body);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (${typeName.toLowerCase()}) {
      await update${typeName}(Number(${typeName.toLowerCase()}.id), { title, body, userId: ${typeName.toLowerCase()}.userId });
      router.push('/${typeName.toLowerCase()}s');
    }
  };

  if (!${typeName.toLowerCase()}) return <div>Loading...</div>;

  return (
    <div>
      <h1>Edit ${typeName}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default Edit${typeName};
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
      const dynamicRouteContent = generateDynamicRouteContent(capitalizedTypeName);
      fs.writeFileSync(dynamicRouteFilePath, dynamicRouteContent);
      console.log(`File ${dynamicRouteFilePath} successfully created for type ${capitalizedTypeName}!`);
    }

    const indexFilePath = path.join(typeDirPath, 'page.tsx');
    if (!fs.existsSync(indexFilePath)) {
      const indexContent = generateIndexPageContent(capitalizedTypeName);
      fs.writeFileSync(indexFilePath, indexContent);
      console.log(`File ${indexFilePath} successfully created for type ${capitalizedTypeName}!`);
    }

    const createDirPath = path.join(typeDirPath, 'create');
    if (!fs.existsSync(createDirPath)) {
      fs.mkdirSync(createDirPath, { recursive: true });
    }

    const createFilePath = path.join(createDirPath, 'page.tsx');
    if (!fs.existsSync(createFilePath)) {
      const createContent = generateCreatePageContent(capitalizedTypeName);
      fs.writeFileSync(createFilePath, createContent);
      console.log(`File ${createFilePath} successfully created for type ${capitalizedTypeName}!`);
    }

    const editDirPath = path.join(dynamicRouteDirPath, 'edit');
    if (!fs.existsSync(editDirPath)) {
      fs.mkdirSync(editDirPath, { recursive: true });
    }

    const editFilePath = path.join(editDirPath, 'page.tsx');
    if (!fs.existsSync(editFilePath)) {
      const editContent = generateEditPageContent(capitalizedTypeName);
      fs.writeFileSync(editFilePath, editContent);
      console.log(`File ${editFilePath} successfully created for type ${capitalizedTypeName}!`);
    }

    console.log('Operation completed!');
  }
}

