import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import chalk from 'chalk';
export let additionalTypes = '';

const agent = new https.Agent({
    rejectUnauthorized: false
});

export async function main() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'baseUrl',
            message: '\n' +'Please enter the base API URL:'+'\n'
        },
        {
            type: 'input',
            name: 'endpoints',
            message: '\n'+'Please enter the endpoints separated by commas (without leading slash):'+'\n'
        }
    ]);

    const { baseUrl, endpoints } = answers;

    function createEnvLocalFile() {
        const envLocalPath = path.join(process.cwd(), '.env.local');

        try {
            if (!fs.existsSync(envLocalPath)) {
                const envContent = `# Variables d'environnement pour l'API\nNEXT_PUBLIC_API_URL=${answers.baseUrl}\nAPI_KEY=your-api-key\n`;
                fs.writeFileSync(envLocalPath, envContent);
                console.log(`Fichier ${envLocalPath} créé avec succès !`);
            } else {
                console.log(`${envLocalPath} existe déjà.`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création du répertoire : ${error.message}`);
        }
    }

    createEnvLocalFile();

    const endpointList = endpoints.split(',').map(endpoint => endpoint.trim());
    for (const endpoint of endpointList) {
        const apiUrl = `${baseUrl}/${endpoint}`;
        const typeName = getTypeNameFromUrl(endpoint);
        https.get(apiUrl, { agent }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const response = JSON.parse(data);
                const typesContent = generateTypesContent(response, typeName);
                const filePath = path.join(process.cwd(), 'types.d.ts');
                appendTypesToFile(typesContent + additionalTypes, filePath, typeName);
                console.log(`Types written to: ${filePath}`);
            });

        }).on('error', (err) => {
            console.error(`Error fetching API: ${err.message}`);
        });
    }
}

export function getTypeNameFromUrl(url) {
    const urlSegments = url.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/s$/, '');
}

export function generateTypesContent(data, typeName) {
    const sampleData = Array.isArray(data) && data.length > 0 ? data[0] : data;

    let types = `type ${typeName} = {\n`;
    Object.keys(sampleData).forEach((key) => {
        const value = sampleData[key];
        if (typeof value === 'object' && !Array.isArray(value)) {
            types += `  ${key}: {\n`;
            Object.keys(value).forEach((subKey) => {
                const subValue = value[subKey];
                if (typeof subValue === 'object' && !Array.isArray(subValue)) {
                    types += `    ${subKey}: {\n`;
                    Object.keys(subValue).forEach((innerKey) => {
                        const innerValue = subValue[innerKey];
                        const innerValueType = getType(innerValue, '', '');
                        types += `      ${innerKey}: ${innerValueType};\n`;
                    });
                    types += `    };\n`;
                } else {
                    const subValueType = getType(subValue, '', '');
                    types += `    ${subKey}: ${subValueType};\n`;
                }
            });
            types += `  };\n`;
        } else {
            const valueType = getType(value, '', '');
            types += `  ${key}: ${valueType};\n`;
        }
    });
    types += '};\n\n';
    return types;
}

export function getType(value, typeName, key) {
    if (value === null) {
        return 'any';
    } else if (Array.isArray(value)) {
        const singularTypeName = key.replace(/s$/, '');
        const arrayItemType = value.length > 0 ? getType(value[0], singularTypeName, '') : 'any';
        return `${arrayItemType}[]`;
    } else if (typeof value === 'object') {
        const nestedTypeName = `${typeName}${key.charAt(0).toUpperCase() + key.slice(1)}Type`;
        additionalTypes += generateTypesContent(value, nestedTypeName);
        return nestedTypeName;
    } else {
        return typeof value;
    }
}

export function appendTypesToFile(content, filePath, typeName) {
    if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const typeRegex = new RegExp(`type ${typeName} = {`, 'g');
        if (existingContent.match(typeRegex)) {
            console.error(chalk.red(`Type '${typeName}' already exists in the file. Please remove the old definition first.`));
            return;
        }
        fs.writeFileSync(filePath, existingContent + '\n' + content);
    } else {
        fs.writeFileSync(filePath, content);
    }
}
