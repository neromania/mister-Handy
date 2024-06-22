import welcome from 'cli-welcome';
import pkg from '../package.json' assert { type: 'json' };
import unhandled from 'cli-handle-unhandled';
import {MrHandy} from './mrHandy.js';

const init = ({ clear = true }) => {
  MrHandy();
  unhandled();
  welcome({
    title: `mister-handy`,
    tagLine: `by Ism TkL`,
    description: pkg.description,
    version: pkg.version,
    bgColor: '#36BB09',
    color: '#000000',
    bold: true,
    clear
  });
};

export default init;
