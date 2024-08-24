# Mister Handy

![Mr. Handy Logo application](logoMrHandy.png)
![Mr. Handy Logo from the game](cookhandy.png)

**Mister Handy** is a powerful command-line interface designed to streamline and enhance the development workflow. With a focus on API consumption and rapid testing, Mister Handy provides developers with a suite of tools for generating controllers, templates, and forms, making it an indispensable asset for modern web development.

## Features

- **Automatic Route Generation**: Easily create React components for displaying details of a specific type.
- **Full CRUD Operations**: Generates functions to fetch, create, update, and delete resources via an API.
- **User-Friendly CLI**: Utilizes `inquirer` to interact with the user and select the type to generate.

## Prerequisites

- Node.js
- TypeScript

## Installation

To install the package, run the following command:

```bash
npm install mister-handy
```

## Usage

To generate dynamic routes, execute the following command:

```bash
mister-handy create-types
```

### Available Commands

- **create-types**: Generates types based on the definitions in `types.d.ts`.
- **create-library**: Creates a library structure for your project.
- **generate-routes**: Generates API routes based on the selected type.
- **generate-pages**: Generates pages for your Next.js application.

### Example of Generated Component

The script generates a detail component similar to the following:

```javascript
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, deleteUser } from '@/app/api/users/route';

function UserDetail({ params }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      const data = await getUser(Number(params.id));
      setUser(data);
    }
    fetchUser();
  }, [params.id]);

  async function handleDelete() {
    if (user) {
      await deleteUser(Number(user.id));
      router.push('/');
    }
  }

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>User Detail</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>
              <button onClick={handleDelete}>Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

## Contributing

Contributions are welcome! If you would like to contribute, please follow these steps:

1. Fork this repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push your branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

## License

This project is licensed under the GNU General Public License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgements

Thanks to everyone who contributed to this project!
