const request = require('request');
const Twitter = require('twitter');
const config = require('./config.js');

let client = new Twitter(config.twitter);

let codex_bot_notify = function (text) {
    request.post(config.codex_bot_url).form({message:text});
};

let telegram_send_message = function (chat, text, disable_preview = false) {
    let x = request.post(
        'https://api.telegram.org/bot' + config.telegram.bot_token + '/sendMessage'
    ).form({
        chat_id: chat,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: disable_preview
    });
};

let stream = client.stream('user', {tweet_mode: 'extended', include_entities: true});

stream.on('data', function(event) {
    try {

        console.log(event);

        let message = event.truncated ? event.extended_tweet.full_text : event.text,
            source = event.user.screen_name;

        try {
            let retweet = event.retweeted_status;

            message = retweet.truncated ? retweet.extended_tweet.full_text : retweet.text;

            let username = event.user.screen_name,
                link = 'https://twitter.com/' + username + '/status/' + event.id_str,
                rt_source = event.retweeted_status.user.screen_name,
                rt_link = 'https://twitter.com/' + rt_source + '/status/' + event.retweeted_status.id_str;

            message = '<a href="' + link + '">' + event.user.name + '</a> RT <a href="' + rt_link + '">' + event.retweeted_status.user.name + '</a>: ' + message;

            event = event.retweeted_status;
        } catch (err) {

            let username = event.user.screen_name,
                link = 'https://twitter.com/' + username + '/status/' + event.id_str;

            message = '<a href="' + link + '">' + event.user.name + '</a>: ' + message;

        }

        let disable_preview = true;

        // Unwrap t.co links
        try {
            let urls = event.truncated ? event.extended_tweet.entities.urls : event.entities.urls;

            urls.forEach(function (link) {
                message = message.replace(link.url, link.expanded_url);
            });

            // Get preview for the  first link
            message = '<a href="' + urls[0].expanded_url + '">⁠</a>' + message;
            disable_preview = false;
        } catch (err) {
            //console.log(err);
        }

        // Get first image and set as preview
        try {
            let image = event.truncated ? event.extended_tweet.entities.media[0] : event.entities.media[0],
                image_media_url = image.media_url_https,
                image_url = image.url;

            message = '<a href="' + image_media_url + '">⁠</a>' + message.replace(image_url, "");
            disable_preview = false;
        } catch (err) {
            //console.log(err);
        }

        
        // try to attach video
        try {
            let media = event.extended_tweet.extended_entities.media[0] || event.extended_entities.media[0] || event.entities.media[0],
                video = media.video_info;

            let link = video.variants[0].url;

            message = '<a href="' + link + '">⁠</a>' + message;
            disable_preview = false;

        } catch (err) {
            console.log(err);
        }

        // Send notify
        if (source in config.telegram.users) {
            try {
                let chats = config.telegram.users[source];
                console.log(chats);
                chats.forEach(function (chat) {
                    try {
                        let chat_id = config.telegram.chats[chat];
                        telegram_send_message(chat_id, message, disable_preview);
                    } catch (err) {
                        console.log('Can\'t send message because of ', err);
                    }
                });
            } catch (err) {
                console.log(err);
            }
        } else {
            telegram_send_message(config.telegram.chats['me'], message, disable_preview);
        }

    } catch (err) {
        console.log(err);
        codex_bot_notify('TwitterBot Error: ' + err);
    }
});

stream.on('error', function(error) {
    console.log(error);
});
