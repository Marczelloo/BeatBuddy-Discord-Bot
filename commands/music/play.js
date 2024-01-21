const { SlashCommandBuilder, EmbedBuilder, InteractionType } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const fs = require('fs');
const path = require('path');

const globals  = require('../../global.js');

const { bassBoost, earrape, nightcore, slowReverb, eightBit, dolbyRetardos, inverted } = require('./eqFunctions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play song from YouTube')
        .addStringOption(option => option
            .setName('name')
            .setDescription('Song name')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('url')
            .setDescription('YouTube URL')
            .setRequired(false)
        ),

    async execute(interaction) 
    {
        await interaction.deferReply();

        const playingRow = new ActionRowBuilder();
        const pausedRow = new ActionRowBuilder();

        const skipButton = new ButtonBuilder()
        .setCustomId('skip-button')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1198248590087307385');

        const rewindButton = new ButtonBuilder()
        .setCustomId('rewind-button')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1198248587369386134')

        const pauseButton = new ButtonBuilder()
        .setCustomId('pause-button')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('1198248585624571904');

        const resumeButton = new ButtonBuilder()
        .setCustomId('resume-button')
        .setStyle(ButtonStyle.Success)
        .setEmoji('1198248583162511430');
        
        const loopButton = new ButtonBuilder()
        .setCustomId('loop-button')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1198248581304418396');

        const seekButton = new ButtonBuilder()
        .setCustomId('shuffle-button')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1198248578146115605')

        playingRow.addComponents([rewindButton, skipButton, pauseButton, loopButton, seekButton]);
        pausedRow.addComponents([rewindButton, skipButton, resumeButton, loopButton, seekButton]);

        const url = interaction.options.getString('url');
        const song = interaction.options.getString('name');

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("You need to be in a voice channel to play music")
            .setTimestamp()

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (!url && !song) {
            const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("You need to provide a YouTube URL or a song name")
            .setTimestamp()

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (url) {
            const songInfo = await ytdl.getInfo(url);
            const newSong = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                image: songInfo.videoDetails.thumbnails[0].url,
                length: songInfo.videoDetails.lengthSeconds
            };
               
            globals.queue.push(newSong);
            
            const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setAuthor({ name: 'Song added to queue:' })
            .setTitle(newSong.title)
            .setURL(newSong.url)
            .setImage(newSong.image)
            .setTimestamp()

            interaction.editReply({ embeds: [embed] });
            
        }

        if (song) {
            const searchResults = await ytsr(song, { limit: 1 });
            const video = searchResults.items[0];

            if (!video) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("No search results found for the song")
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const newSong = {
                title: video.title,
                url: video.url,
                image: video.bestThumbnail.url,
                length: video.duration,
            };

            globals.queue.push(newSong);

            const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setAuthor({ name: 'Song added to queue:' })
            .setTitle(newSong.title)
            .setURL(newSong.url)
            .setImage(newSong.image)
            .setTimestamp()

            await interaction.editReply({ embeds: [embed] });
        }

        if(globals.firstCommandTimestamp === null)
        {
            globals.firstCommandTimestamp = Date.now();
        }

        if (globals.queue.length >= 1) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        
            if(globals.player == null) 
            {
                globals.player = createAudioPlayer();
            }

            let outputFilePath;  // Define outputFilePath here

            async function playNextSong() {
                if (globals.queue.length === 0) {
                    globals.player.stop();
                    return;
                }


                let formattedTime;
                if(globals.queue[0].length.includes(":"))
                {
                    formattedTime = globals.queue[0].length;
                }
                else
                {
                    const lengthInSeconds = globals.queue[0].length;
                    const minutes = Math.floor(lengthInSeconds / 60);
                    const seconds = lengthInSeconds % 60;
                    const formattedLength = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
                    if (minutes >= 60) {
                        const hours = Math.floor(minutes / 60);
                        const remainingMinutes = minutes % 60;
                        formattedTime = `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    } 
                    else 
                    {
                        formattedTime = formattedLength;
                    }
                }

                const nowPlayingEmbedFields = [
                    { name: 'Length: ', value: formattedTime, inline: true },
                    { name: 'Status', value: globals.player.state.status === AudioPlayerStatus.Playing ? 'Playing' : 'Paused' , inline: true },
                    { name: 'Loop: ', value: globals.loop === globals.LoopType.NO_LOOP ? 'No loop' : globals.loop === globals.LoopType.LOOP_SONG ? 'Song loop' : 'Queue loop', inline: true },
                    { name: 'Volume: ', value: globals.resource ? globals.resource.volume.volume * 100 : '5', inline: true },
                    { name: 'EQ: ', value: globals.eqEffect ? globals.eqEffect : 'None', inline: true },
                    { name: 'Shuffle: ', value: globals.shuffle ? 'On' : 'Off', inline: true }]
                
                const nowPlayingEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setAuthor({ name: 'Now playing:' })
                .setTitle(globals.queue[0].title)
                .setURL(globals.queue[0].url)
                .setImage(globals.queue[0].image)
                .setTimestamp()
                
                outputFilePath = path.resolve(__dirname, 'output.ogg');  
        
                const stream = ytdl(globals.queue[0].url, { filter: 'audioonly', quality: 'highestaudio' });
                const writer = stream.pipe(fs.createWriteStream(outputFilePath));
        
                writer.on('finish', async () => {
                    const eq = globals.eqEffect;
                
                    if(eq)
                    {
                        switch(eq)
                        {
                            case 'bassboost':
                                await bassBoost();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            case 'earrape':
                                await earrape();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            case 'nightcore':
                                await nightcore();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            case 'slowReverb':
                                await slowReverb();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            case 'eightBit':
                                await eightBit();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            case "dolbyRetardos":
                                await dolbyRetardos();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            case "inverted":
                                await inverted();
                                outputFilePath = path.resolve(__dirname, "eqOutput.ogg");
                                break;
                            default:
                                break;
                        }
                    }

                    const resource = createAudioResource(outputFilePath, { inputType: StreamType.OggOpus, inlineVolume: true });
                    resource.volume.setVolume(0.05);

                    globals.resource = resource;

                    globals.player.play(resource);
                    connection.subscribe(globals.player);
                    globals.isSkipped = false;

                    nowPlayingEmbedFields[1].value = 'Playing';
                    nowPlayingEmbedFields[3].value = (globals.resource.volume.volume * 100).toString();
                    nowPlayingEmbed.addFields(nowPlayingEmbedFields);
                    
                    if (globals.nowPlayingMessage) 
                    {
                        interaction.channel.messages.fetch(globals.nowPlayingMessage)
                            .then(message => {
                                if (message) message.delete().catch(console.error);
                            }).catch(console.error);
                    }
                    
                    if (globals.player.AudioPlayerStatus === AudioPlayerStatus.Paused) 
                    {
                        interaction.channel.send({ embeds: [nowPlayingEmbed], components: [pausedRow], position: 'end' })
                            .then(nowPlayingMessage => {
                                globals.nowPlayingMessage = nowPlayingMessage.id;
                            }).catch(console.error);
                    } 
                    else 
                    {
                        interaction.channel.send({ embeds: [nowPlayingEmbed], components: [playingRow], position: 'end' })
                            .then(nowPlayingMessage => {
                                globals.nowPlayingMessage = nowPlayingMessage.id;
                            }).catch(console.error);
                    }

                    const filter = i => i.user.id === interaction.user.id;
                    try
                    {
                        const time = globals.queue[0].length * 1000 + 2000;
                        const collector = interaction.channel.createMessageComponentCollector({ filter, time: time });

                        collector.on('collect', async(confirmation) => {
                            if(confirmation.customId === 'rewind-button')
                            {
                                if(globals.playedSongs.length === 0)
                                {
                                    globals.queue.unshift(globals.queue[0])
                                    collector.stop();
                                    globals.player.stop();
                                    return;
                                }
                            
                                globals.queue.unshift(globals.playedSongs[0])
                                globals.playedSongs.shift();
                                globals.player.stop();
                                


                                nowPlayingEmbedFields[1].value = 'Playing';
                                nowPlayingEmbed.setFields(nowPlayingEmbedFields);
                                collector.stop();

                                await confirmation.update({ embeds: [nowPlayingEmbed], position: 'end' });
                            }
                            else if(confirmation.customId === "skip-button")
                            {
                                collector.stop();
                                globals.player.stop();

                                await confirmation.update({ embeds: [nowPlayingEmbed], position: 'end' });
                            }
                            else if(confirmation.customId === "pause-button")
                            {
                                globals.player.pause();

                                nowPlayingEmbedFields[1].value = 'Paused';
                                nowPlayingEmbed.setFields(nowPlayingEmbedFields);
                            
                                await confirmation.update({ embeds: [nowPlayingEmbed], components: [pausedRow], position: 'end' });
                            }
                            else if(confirmation.customId === "resume-button")
                            {
                                globals.player.unpause();

                                nowPlayingEmbedFields[1].value = 'Playing';
                                nowPlayingEmbed.setFields(nowPlayingEmbedFields);

                                await confirmation.update({ embeds: [nowPlayingEmbed], components: [playingRow], position: 'end' });
                            }
                            else if(confirmation.customId === "loop-button")
                            {
                                if(globals.loop === globals.LoopType.NO_LOOP)
                                {
                                    globals.loop = globals.LoopType.LOOP_SONG;
                                }
                                else if(globals.loop === globals.LoopType.LOOP_SONG)
                                {
                                    globals.loop = globals.LoopType.LOOP_QUEUE;
                                }
                                else if(globals.loop === globals.LoopType.LOOP_QUEUE)
                                {
                                    globals.loop = globals.LoopType.NO_LOOP;
                                }

                                nowPlayingEmbedFields[2].value = globals.loop === globals.LoopType.NO_LOOP ? 'No loop' : globals.loop === globals.LoopType.LOOP_SONG ? 'Song loop' : 'Queue loop';
                                nowPlayingEmbed.setFields(nowPlayingEmbedFields);
                               
                                await confirmation.update({ embeds: [nowPlayingEmbed], position: 'end' });

                            }
                            else if(confirmation.customId === "shuffle-button")
                            {
                                globals.shuffle = !globals.shuffle;

                                if(globals.shuffle)
                                {
                                    globals.originalQueue = globals.queue;
                                    globals.queue = globals.queue.sort(() => Math.random() - 0.5);
                                }
                                else
                                {
                                    globals.queue = globals.originalQueue;
                                }

                                nowPlayingEmbedFields[5].value = globals.shuffle ? 'On' : 'Off';
                                nowPlayingEmbed.setFields(nowPlayingEmbedFields);

                                await confirmation.update({ embeds: [nowPlayingEmbed], position: 'end' });
                            }                            
                        })
                    }
                    catch(err)
                    {
                        console.error(err);
                    }
                });
            }
        
            globals.player.on('idle', () => {
                if(globals.schedulerPlaying)
                {
                    globals.schedulerPlaying = false;
                    playNextSong(); 
                    return;
                }
                if(!globals.isSkipped)
                {
                    console.log("Player idle");
                    globals.isSkipped = true;
    
                    switch(globals.loop)
                    {
                        case globals.LoopType.LOOP_QUEUE:
                            globals.queue.push(globals.queue[0]);
                            globals.playedSongs.unshift(globals.queue[0])
                            globals.queue.shift();
                            break;
                        case globals.LoopType.LOOP_SONG:
                            globals.queue.unshift(globals.queue[0]);
                            globals.queue.shift();
                            break;
                        case globals.LoopType.NO_LOOP:
                            globals.playedSongs.unshift(globals.queue[0])
                            globals.queue.shift(); 
                            globals.originalQueue.filter(song => song !== globals.queue[0]);
                            break;
                        default:
                            globals.playedSongs.unshift(globals.queue[0])
                            globals.queue.shift(); 
                            globals.originalQueue.filter(song => song !== globals.queue[0]);

                            break;
                    }

                    if (globals.queue.length === 0) {
                        interaction.channel.messages
                            .fetch(globals.nowPlayingMessage)
                            .then((message) => {
                                if (message) message.delete().catch(console.error);
                            })
                            .catch(console.error);

                        const channel = interaction.channel;

                        channel.messages
                            .fetch({ limit: 100 })
                            .then((messages) => {
                                const botMessages = messages.filter(
                                    (message) =>
                                        message.author.bot && message.createdTimestamp > globals.firstCommandTimestamp
                                );

                                channel
                                    .bulkDelete(botMessages, true)
                                    .then(() => {
                                        console.log('Bot messages and replies deleted');
                                    })
                                    .catch((error) => {
                                        console.error('Error deleting bot messages and replies:', error);
                                    });
                            })
                            .catch((error) => {
                                console.error('Error fetching messages:', error);
                            });
                    }
                    else
                    {
                        playNextSong(); 
                    }
                    
                }
            });
            
            if(globals.player.state.status === AudioPlayerStatus.Playing) return;
            else playNextSong();
        }
    }    
}