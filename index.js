const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

const { token } = require('./config.json');
const globals = require('./global.js');

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const vcLeaveReset = require('./commands/music/vcLeaveReset.js');
const { schedulePlay }  = require('./commands/music/playScheduler.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, 
	GatewayIntentBits.GuildPresences, 
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildModeration, 
	GatewayIntentBits.GuildEmojisAndStickers, 
	GatewayIntentBits.GuildIntegrations,
	GatewayIntentBits.GuildWebhooks,
	GatewayIntentBits.GuildInvites, 
	GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.GuildMessageReactions, 
	GatewayIntentBits.GuildMessageTyping, 
	GatewayIntentBits.DirectMessages, 
	GatewayIntentBits.DirectMessageReactions, 
	GatewayIntentBits.DirectMessageTyping, 
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildScheduledEvents, 
	GatewayIntentBits.AutoModerationConfiguration, 
	GatewayIntentBits.AutoModerationExecution ]});

client.commands = new Collection();
globals.client = client;
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders){
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for(const file of commandFiles){
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
	
		if('data' in command && 'execute' in command){
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a require "data" or "execute" property`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));


for(const file of eventsFiles){
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if(event.once){
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('voiceStateUpdate', (oldState, newState) => {
	
	if(oldState.member.user.id === client.user.id && newState.channelId === null)
	{
		vcLeaveReset();
	}
})

client.on('voiceStateUpdate', (oldState, newState) => {
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    const oldMembers = oldChannel.members.size;
    const newMembers = newChannel.members.size;

    if (oldMembers !== newMembers) {
		if(newMembers === 1)
		{
			setTimeout(() => {
				if(newChannel.members.size === 1)
				{
					vcLeaveReset();
				}
			}, 60000);
		}
	}
  }
});


const schedulersPath = path.join(__dirname, 'commands/music/schedulers.json');
try 
{
	const fileData = fs.readFileSync(schedulersPath, 'utf8');
	const jsonData = JSON.parse(fileData);
	for(const data of jsonData)
	{
		if(data.guildId === 'default')
		{
			globals.schedulers = data.schedulers;
		}
	}
}
catch (err)
{
	console.error(err);
	fs.writeFileSync(schedulersPath, '[]', 'utf8');
}


cron.schedule('0 9 * * *', function() {
	console.log("Scheduler on 9:00");
    schedulePlay('morning');
}, {
    timezone: 'Europe/Warsaw'
});


cron.schedule('37 21 * * *', function() {
	console.log("Scheduler on 21:37");
	schedulePlay('evening');
}, {
	timezone: 'Europe/Warsaw'
});

client.login(token);

