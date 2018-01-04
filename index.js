const request = require('request');
const Twitter = require('twitter');
const config = require('./config.js');

let client = new Twitter(config.twitter);

let codex_bot_notify = function (text) {
    request.post(config.codex_bot_url).form({message:text});
};

let telegram_send_message = function (chat, text, disable_preview = false) {
    request.post(
        'https://api.telegram.org/bot' + config.telegram.bot_token + '/sendMessage'
    ).form({
        chat_id: chat,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: disable_preview
    });
};


let stream = client.stream('user', {tweet_mode: 'extended', include_entities: true});
// var stream = client.stream('statuses/filter', {track: 'apple'});
stream.on('data', function(event) {
    console.log(event.entities.urls);

    let tweet_text = event.truncated ? event.extended_tweet.full_text : event.text;

    let disable_preview = true;

    try {
        let urls = event.truncated ? event.extended_tweet.extended_entities.urls : event.entities.urls;

        urls.forEach(function(link){
            tweet_text = tweet_text.replace(link.url, link.expanded_url);
        });
        // disable_preview = false;
    } catch(err) {
        console.log(err);
    }

    let username = event.user.screen_name,
        link = 'https://twitter.com/' + username + '/status/' + event.id_str,
        message = '[' + event.user.name + '](' + link + '): ' + tweet_text;


    try {
        let image = event.truncated ? event.extended_tweet.extended_entities.media[0] : event.entities.media[0];

        console.log(image);
        let image_media_url = image.media_url_https;
        let image_url = image.url;

        message = '[⁠](' + image_media_url + ')' + message;
        disable_preview = false;
        message = message.replace(image_url, "");
    } catch(err) {
        console.log(err);
    }

    if (username in config.telegram.users) {
        try {
            let chats = config.telegram.users[username];
            console.log(chats);
            chats.forEach(function (chat) {
                try {
                    let chat_id = config.telegram.chats[chat];
                    telegram_send_message(chat_id, message, disable_preview);
                } catch (err) {
                    console.log(err);
                }
            });
        } catch (err) {
            console.log(err);
        }
    } else {
        telegram_send_message(config.telegram.chats['me'], message, disable_preview);
    }

    // console.log(message);
});

stream.on('error', function(error) {
    console.log(error);
});
