#!/usr/bin/env node

// /**
//  * mister-handy
//  * Mr Handy (character form Fallout) is a powerful command-line interface designed to streamline and enhance the development workflow. With a focus on API consumption and rapid testing, Mr Handy provides developers with a suite of tools for generating controllers, templates, and forms, making it an indispensable asset for modern web development.
//  *
//  * @author Ism TkL <takkalismail.ddns.net>
//  */

import init from './utils/init.js';
import { cli } from './utils/cli.js';
import log from './utils/log.js';
import { main } from './utils/generateTypes.js';
import { generateRoutes } from './utils/generateRoutes.js';
import { generatePages } from './utils/generatePages.js';
import { MrHandy } from './utils/mrHandy.js';

const input = cli.input;
const flags = cli.flags;
const { clear, debug, mrHandy } = flags;

(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);
	if (input.includes('create-types')) {
		MrHandy();
		setTimeout(() => {
        	 main();
		}, 10);
		
	}
	if (input.includes('create-library')) {
		await createLibrary();
	}
	if (input.includes('generate-routes')) {
		await generateRoutes();
	}
	if (input.includes('generate-pages')) {
		await generatePages();
	}
	debug && log(flags);
})();
