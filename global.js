const LoopType = {
    NO_LOOP: 0,
    LOOP_QUEUE: 1,
    LOOP_SONG: 2
};

module.exports = {
    queue: [],
    originalQueue: [],
    playedSongs: [],
    firstCommandTimestamp: null,
    guildId: null,
    commandChannel: null,
    playEarlier: false,
    ageRestricted: false,
    player: null,
    resource: null,
    client: null,
    eqEffect: null,
    isSkipped: false,
    LoopType: LoopType,
    loop: LoopType.NO_LOOP,
    shuffle: false, //
    nowPlayingMessage: null,
    schedulerPlaying: false,
    timeout: null,
    autoplay: false,
    spotify_token: null,
    spotify_token_expires: null,
    playerMessage: null,
};

