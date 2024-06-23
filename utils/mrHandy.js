import figlet from 'figlet';
import chalk from 'chalk';

export async function MrHandy(){

figlet.text(
  'Mr. Handy',
  {
    font: 'Slant Relief',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 180,
    whitespaceBreak: true,
  },
  (err, data) => {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log('\n' + chalk.greenBright.bgBlack(data) + '\n');
  }
);
}