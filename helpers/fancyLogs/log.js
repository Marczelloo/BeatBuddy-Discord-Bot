const LogTextColor =  {
   BLACK: '\x1b[30m',
   RED: '\x1b[31m',
   GREEN: '\x1b[32m',
   YELLOW: '\x1b[33m',
   BLUE: '\x1b[34m',
   MAGENTA: '\x1b[35m',
   CYAN: '\x1b[36m',
   WHITE: '\x1b[37m',
}

const LogBackgroundColor = {
   BLACK: '\x1b[40m',
   RED: '\x1b[41m',
   GREEN: '\x1b[42m',
   YELLOW: '\x1b[43m',
   BLUE: '\x1b[44m',
   MAGENTA: '\x1b[45m',
   CYAN: '\x1b[46m',
   WHITE: '\x1b[47m',
   GRAY: '\x1b[100m',
}

const Blocks = {
   FULL: '█',
   HALF: '▓',
   QUARTER: '▒',
   EMPTY: '░',
   LEFTHALF: '▌',
   RIGHTHALF: '▐',
}

const ProgressBarBlocks = [
   ' ',
   '▏',
   '▎',
   '▍',
   '▌',
   '▋',
   '▊',
   '▉',
   '█'
]

const bright = '\x1b[1m';

const spacer = '     ';
const spacerHalf = '  ';

const reset = '\x1b[0m';



class Log {
   static info (message, arg, ...additionalInfo) {
      const time = new Date().toLocaleTimeString()
      let formattedMessage = "";
      formattedMessage += `${bright}${LogTextColor.WHITE}${LogBackgroundColor.CYAN} ${Blocks.LEFTHALF}INFO${spacer}   ${reset}`;
      formattedMessage += `${LogTextColor.WHITE}${LogBackgroundColor.GRAY} ${time} `;
      if(additionalInfo.length != 0) {
         formattedMessage += `${Blocks.FULL} `;
         const infoString = additionalInfo.map((info, index) => {
            if (index === additionalInfo.length - 1) {
               return `${info} ${reset}`;
            } else {
               return `${info} ${Blocks.FULL} `;
            }
         }).join('');

         formattedMessage += infoString;
      }
      formattedMessage += `${LogBackgroundColor.CYAN} ${reset}`;
      formattedMessage += `${bright}${LogTextColor.CYAN} ${spacerHalf} ${message}${arg ? ` ${arg}` : ''}${reset}`;
      console.log(formattedMessage);
   }

   static success(message, arg, ...additionalInfo) {
      const time = new Date().toLocaleTimeString()
      let formattedMessage = "";
      formattedMessage += `${bright}${LogTextColor.WHITE}${LogBackgroundColor.GREEN} ${Blocks.LEFTHALF}SUCCESS${spacer}${reset}`;
      formattedMessage += `${LogTextColor.WHITE}${LogBackgroundColor.GRAY} ${time} `;
      if(additionalInfo.length != 0) {
         formattedMessage += `${Blocks.FULL} `;
         const infoString = additionalInfo.map((info, index) => {
            if (index === additionalInfo.length - 1) {
               return `${info} ${reset}`;
            } else {
               return `${info} ${Blocks.FULL} `;
            }
         }).join('');

         formattedMessage += infoString;
      }
      formattedMessage += `${LogBackgroundColor.GREEN} ${reset}`;
      formattedMessage += `${bright}${LogTextColor.GREEN} ${spacerHalf} ${message}${arg ? ` ${arg}` : ''}${reset}`;
      console.log(formattedMessage);
   }

   static warning(message, arg = null, ...additionalInfo) {
      const time = new Date().toLocaleTimeString()
      let formattedMessage = "";
      formattedMessage += `${bright}${LogTextColor.WHITE}${LogBackgroundColor.YELLOW} ${Blocks.LEFTHALF}WARNING${spacer}${reset}`;
      formattedMessage += `${LogTextColor.WHITE}${LogBackgroundColor.GRAY} ${time} `;
      if(additionalInfo.length != 0) {
         formattedMessage += `${Blocks.FULL} `;
         const infoString = additionalInfo.map((info, index) => {
            if (index === additionalInfo.length - 1) {
               return `${info} ${reset}`;
            } else {
               return `${info} ${Blocks.FULL} `;
            }
         }).join('');

         formattedMessage += infoString;
      }
      formattedMessage += `${LogBackgroundColor.YELLOW} ${reset}`;
      formattedMessage += `${bright}${LogTextColor.YELLOW} ${spacerHalf} ${message}${arg ? ` ${arg}` : ''}${reset}`;
      console.log(formattedMessage);
   }

   static error(message, arg = null, ...additionalInfo) {
      const time = new Date().toLocaleTimeString()
      let formattedMessage = "";
      formattedMessage += `${bright}${LogTextColor.WHITE}${LogBackgroundColor.RED} ${Blocks.LEFTHALF}ERROR${spacer}  ${reset}`;
      formattedMessage += `${LogTextColor.WHITE}${LogBackgroundColor.GRAY} ${time} `;
      if(additionalInfo.length != 0) {
         formattedMessage += `${Blocks.FULL} `;
         const infoString = additionalInfo.map((info, index) => {
            if (index === additionalInfo.length - 1) {
               return `${info} ${reset}`;
            } else {
               return `${info} ${Blocks.FULL} `;
            }
         }).join('');

         formattedMessage += infoString;
      }
      formattedMessage += `${LogBackgroundColor.RED} ${reset}`;
      formattedMessage += `${bright}${LogTextColor.RED} ${spacerHalf} ${message}${arg ? ` ${arg}` : ''}${reset}`;
      console.log(formattedMessage);
   }

   static progress(message, progress, ...additionalInfo) {
      if (progress > 100) {
         progress = 100;
      }
   
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      const progressBarLength = 20;
      const totalBlocks = progressBarLength * 8; // Total number of sub-blocks
      const filledBlocks = Math.floor(totalBlocks * progress / 100);
      const fullBlockCount = Math.floor(filledBlocks / 8); // Full blocks
      const partialBlockIndex = filledBlocks % 8; // Index for the partial block
      const emptyBlockCount = progressBarLength - fullBlockCount - (partialBlockIndex > 0 ? 1 : 0); // Calculate empty blocks
   
      const progressBar = `${ProgressBarBlocks[8].repeat(fullBlockCount)}${ProgressBarBlocks[partialBlockIndex]}${ProgressBarBlocks[0].repeat(Math.max(0, emptyBlockCount))}`;

      const time = new Date().toLocaleTimeString();

      let formattedMessage = "";
      formattedMessage += `${bright}${LogTextColor.WHITE}${LogBackgroundColor.BLUE} ${Blocks.LEFTHALF}PROGRESS${spacer.substring(1,5)}${reset}`;
      formattedMessage += `${LogTextColor.WHITE}${LogBackgroundColor.GRAY} ${time} `;
      if(additionalInfo.length != 0) {
         formattedMessage += `${Blocks.FULL} `;
         const infoString = additionalInfo.map((info, index) => {
            if (index === additionalInfo.length - 1) {
               return `${info} ${reset}`;
            } else {
               return `${info} ${Blocks.FULL} `;
            }
         }).join('');

         formattedMessage += infoString;
      }
      formattedMessage += `${LogBackgroundColor.BLUE} ${reset}`;
      formattedMessage += `${bright}${LogTextColor.BLUE} ${spacerHalf} `;
      const progressBarWithPercentage = `${formattedMessage}${message}: [${progressBar}] ${progress.toFixed(2)}%`;
   
      process.stdout.write(progressBarWithPercentage);
   
      if (progress === 100) {
         process.stdout.write('\n');
      }
   }
}


module.exports = Log;