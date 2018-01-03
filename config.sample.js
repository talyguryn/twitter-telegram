module.exports = {
    twitter: {
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: ''
    },
    codex_bot_url: '',
    telegram: {
        bot_token: '',

        // chats db
        chats: {
            me: 123456,
            workgroup: -123456789
        },

        // Map user->chats
        users: {
            mudakoff: ['workgroup', 'me'],
            meduzaproject: ['workgroup']
        }
    },
}
