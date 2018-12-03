<script id="aod_player_js" type="application/javascript">

    window.player = {};

    // Set loading value
    window.player.setLoading = function(value) {
        window.player.loading = value;
    };

    window.player.isMobile = function () {
        return window.innerWidth <= 995;
    };

    // Get player status
    window.player.getPlayerStatus = function() {
        try {
            return window.player.mediaPlayer.getStatus();
        } catch (e) {}
    };

    window.player.setPlayingId = function(id) {
        window.player.playingAudioId = id;
    };

    window.player.getPlayingId = function() {
        return window.player.playingAudioId;
    };

    window.player.getIdRuta = function () {
        return window.idRuta;
    };

    window.player.setIdRuta = function (ruta) {
        window.idRuta = ruta;
    };

    window.player.getMetas = function () {
        return window.metas;
    };

    window.player.setMetas = function (metas) {
        window.metas = metas;
    };

    window.player.updatePlayer = function(newParams, metas, buttonClicked) {
        try {
            if (!window.player.mediaPlayer.getStatus() && !window.player.adModule.getStatus()) {
                window.player.setLoading(true);
            }

            var object = Object.assign(window.player.params, newParams);

            if (newParams.id_media !== window.player.getPlayingId()) {
                window.player.ads = false;
                window.player.prads = false;
                window.player.mediaTopEmbed.reset(object);
                window.player.playerReseted = true;
            }
            else if (buttonClicked && 'play' === window.player.getPlayerStatus()) {
                window.player.mediaPlayer.pause();
            }
            else if (buttonClicked) {
                window.player.mediaPlayer.play();
            }

            // Send SEO to player
            window.player.setMetas(metas);
            sendMetasToPlayer();
            
            // Send possible ID for playlist
            sendIdPlaylistToPlayer(newParams.id_media);

        } catch (e) {
            console.error(e);
        }
    };

    window.player.changeStation = function(media) {
        // Track info for audience: Media
        window.player.media = media;

        // Track info for audience: Station
        window.radio_station = media;

    };

    window.player.updateMenuLinks = function () {
        if ('undefined' !== typeof(window.player.media) && window.player.media === window.player.getPlayingId()) {
            $('#menu_navegacion').find('a').each(function (index, item) {
                if ('home' === item.dataset.idRuta) {
                    item.href = item.dataset.href + 'emisora/' + window.player.media + '/';
                    item.dataset.linkHref = item.dataset.href + 'emisora/' + window.player.media + '/';
                }
                else if ('programacion' === item.dataset.idRuta) {
                    item.href = item.dataset.href + window.player.media + '/';
                    item.dataset.linkHref = item.dataset.href + window.player.media + '/';
                }
            });
        }
    };

    window.player.updateBlockWithAjax = function(idBlock, data) {
        if ('undefined' === typeof(idBlock)) {
            console.error('Ajax Error: Missing param in updateBlockWithAjax. idBlock is undefined');
            return false;
        }

        if ('undefined' === typeof(data)) {
            console.error('Ajax Error: Missing param in updateBlockWithAjax. data is undefined');
            return false;
        }

        $('#' + idBlock).replaceWith(data);
    };

    window.player.updateHaSonado = function(idRuta, emisora) {
        if ('undefined' === typeof(idRuta)) {
            console.error('Ajax Error: Missing param in updateHaSonado. idRuta is undefined');
            return false;
        }

        if ('undefined' === typeof(emisora)) {
            console.error('Ajax Error: Missing param in updateHaSonado. emisora is undefined');
            return false;
        }

        if ('home' === idRuta || 'home_emisora' === idRuta) {
            // Get info from Symfony.
            var respuesta = $.ajax({
                url: '/ws/hasonado/' + emisora + '/_fragment',
                type: 'GET',
                dataType: 'HTML'
            });

            console.log("Getting refresh for HaSonado.");

            // Deferred object to return the result.
            var result = $.Deferred();

            $.when(respuesta).done(function (data, textStatus, jqXHR) {
                window.player.updateBlockWithAjax('haSonado', data);

                // Notify listeners that AJAX request is completed.
                console.log("Refresh for HaSonado obtained.");
                result.resolve(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                // Reject deferred if something went wrong.
                console.error("Error getting refresh for HaSonado: " + textStatus);
                result.reject();
            });

            // Return deferred object.
            return result.promise();
        }
        else {
            return false;
        }
    };

    window.player.updateBlocksInHome = function() {
        var idRuta = window.player.getIdRuta();
        if ('undefined' === typeof(idRuta)) {
            console.error('Ajax Error: Missing param in updateBlocksInHome. idRuta is undefined');
            return false;
        }

        if ('home' === idRuta || 'home_emisora' === idRuta) {
            window.player.updateEnDirecto(idRuta, window.player.getPlayingId());
            window.player.updateHaSonado(idRuta, window.player.getPlayingId());
        }
    };

    window.player.updateEnDirecto = function(idRuta, emisora) {
        if ('undefined' === typeof(idRuta)) {
            console.error('Ajax Error: Missing param in updateEnDirecto. idRuta is undefined');
            return false;
        }

        if ('undefined' === typeof(emisora)) {
            console.error('Ajax Error: Missing param in updateEnDirecto. emisora is undefined');
            return false;
        }

        if ('home' === idRuta || 'home_emisora' === idRuta) {
            // Get info from Symfony.
            var respuesta = $.ajax({
                url: '/ws/endirecto/' + emisora + '/_fragment',
                type: 'GET',
                dataType: 'HTML'
            });

            console.log("Getting refresh for EnDirecto.");

            // Deferred object to return the result.
            var result = $.Deferred();

            $.when(respuesta).done(function (data, textStatus, jqXHR) {
                window.player.updateBlockWithAjax('enDirecto', data);

                // Notify listeners that AJAX request is completed.
                console.log("Refresh for EnDirecto obtained.");
                result.resolve(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                // Reject deferred if something went wrong.
                console.error("Error getting refresh for EnDirecto: " + textStatus);
                result.reject();
            });

            // Return deferred object.
            return result.promise();
        }
        else {
            return false;
        }
    };

    function initPlayer(data, idMedia, idRuta, idRefs, topAccount, metas) {
        window.player.setIdRuta(idRuta);
        window.player.setMetas(metas);

        // Audio or Live widget, with ID in HTML data-set
        if (('widget_audio' === idRuta || 'widget_directo' === idRuta) && data) {
            console.time('Player');
            window.player.params = data || false;
            window.player.params.id_media = idMedia;
            window.player.params.playList = {};
            window.player.params.id_player = ( window.player.params.id_player_widget ) ? window.player.params.id_player_widget : window.player.params.id_player;
            window.player.mediaTopEmbed = new psd.media.TopEmbed(window.player.params);
            window.player.mediaTopEmbed.addEventListener(psd.media.TopEmbedEvent.EVENT_INI, onSetEvents);
            window.player.setPlayingId(idMedia);
        }
        // Audio page.
        else if ('audio' === idRuta && data) {
            console.time('Player');
            window.player.params = data || false;
            window.player.params.id_media = idMedia;
            window.player.params.playList = {};
            window.player.mediaTopEmbed = new psd.media.TopEmbed(window.player.params);
            window.player.mediaTopEmbed.addEventListener(psd.media.TopEmbedEvent.EVENT_INI, onSetEvents);
            window.player.setPlayingId(idMedia);
        }
        // For playlist, it's defined a new field.
        else if (('playlist' === idRuta || 'widget_playlist' === idRuta) && data) {
            console.time('Player');
            console.time('Player playlist');
            window.player.params = data || false;
            window.player.params.id_media = "";
            window.player.params.playList = {
                URL_list: '//fapi-top.prisasd.com/api/v1/search/' + topAccount + '/audio/idrefs?idrefs=' + idRefs,
                repeat: '2',
                id_cuenta: data.id_cuenta,
                id_container_playlist: 'top_playlist',
                skin: 'lista',
                skinPlaylist: 'lista',
                playListSkin: 'oneplayer',
                autoNext: true,
                reload_secs: 0
            };
            window.player.params.id_player = 'widget_playlist' === idRuta && window.player.params.id_player_widget ? window.player.params.id_player_widget : window.player.params.id_player;
            window.player.mediaTopEmbed = new psd.media.TopEmbed(window.player.params);
            window.player.mediaTopEmbed.addEventListener(psd.media.TopEmbedEvent.EVENT_INI, onSetEvents);
            window.player.setPlayingId(idMedia);
        }
        // Default.
        else if (data) {
            console.time('Player');
            window.player.params = data || false;
            window.player.mediaTopEmbed = new psd.media.TopEmbed(window.player.params);
            window.player.mediaTopEmbed.addEventListener(psd.media.TopEmbedEvent.EVENT_INI, onSetEvents);
            window.player.setPlayingId(data.id_media);
            // Try to update blocks in Home
            window.player.updateBlocksInHome();
        }
    }

    function onSetEvents() {
        console.timeEnd('Player');

        if (window.player.isMobile()) {
            $('#page-loader').removeClass('cargando').addClass('cargado');
        }

        // Autoplay - set loading to mini-player
        if (window.player.mediaTopEmbed.getMediaPlayer().isLoading()) {
            window.player.setLoading(true);
        }

        window.player.mediaPlayer = window.player.mediaTopEmbed.getMediaPlayer().getMediaModule();
        window.player.mediaPlayer.addEventListener(emic.top.event.MediaEvent.ON_STATUS_CHANGE, onMediaHandler);
        window.player.mediaPlayer.addEventListener(emic.top.event.MediaEvent.ON_RESET_COMPLETE, onMediaHandler);
        window.player.mediaPlayer.addEventListener(emic.top.event.MediaEvent.ON_INIT_COMPLETE, onMediaHandler);
        window.player.mediaPlayer.addEventListener(emic.top.event.MediaEvent.ON_READY, onMediaHandler);

        window.player.skinPlayer = window.player.mediaTopEmbed.getMediaPlayer().getUIModule();
        window.player.skinPlayer.addEventListener(emic.top.event.UIEvent.ON_ORDER_CHANGE_LIVE, onUIEventHandler);

        window.player.adModule = window.player.mediaTopEmbed.getMediaPlayer().getAdModule();
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_VIDEO_START, onAdHandler);
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_VIDEO_PAUSE, onAdHandler);
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_VIDEO_RESUME, onAdHandler);
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_VIDEO_END, onAdHandler);
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_VIDEO_SKIP, onAdHandler);
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_INSTREAM_START, onAdHandler);
        window.player.adModule.addEventListener(emic.top.event.AdEvent.ON_AD_INSTREAM_END, onAdHandler);
        // Send SEO to player
        sendMetasToPlayer();

        // Send possible ID for playlist
        sendIdPlaylistToPlayer(window.player.getPlayingId());
        $(document).trigger('playerLoadCompleted');

        // Listen for change in streaming signal from Triton to update Blocks in Home.
        window.player.mediaPlayer.addEventListener("onCue",function(ev) {
            window.player.updateBlocksInHome();
        });
    }

    function onMediaHandler(ev) {
        switch (ev.type) {
            case emic.top.event.MediaEvent.ON_STATUS_CHANGE:
                console.log("STATUS: ", ev.data.status);

                if (ev.data.status === 'initializing' || ev.data.status === 'GETTING_STATION_INFORMATION') {
                    window.player.setLoading(true);
                }

                else if (ev.data.status === 'play') {
                    window.player.setLoading(false);
                    window.player.setPlayingId(ev.id);
                    $(document).trigger('player:iniciado');
                }

                else if (ev.data.status === 'pause' || ev.data.status === 'stop') {
                    window.player.setLoading(false);
                    $(document).trigger('player:pausado');
                }

                break;

            case emic.top.event.MediaEvent.ON_RESET_COMPLETE:

                // Update object ID loaded in player.
                window.player.setPlayingId(ev.id);

                break;
        }
    }

    function onUIEventHandler(ev) {
        switch (ev.type) {
            case emic.top.event.UIEvent.ON_ORDER_CHANGE_LIVE:
                var href = {};
                var idRuta = window.player.getIdRuta();
                href.query = '';
                // If 'Ir al directo' button is clicked, always go to Home page. Unless it is done in a widget.
                if (ev.botonIrDirecto && 'undefined' !== typeof(idRuta) && 0 !== idRuta.indexOf('widget')) {
                    href.pathname = '/';
                    // Every recirections from player will change the page. Don't need the second parameter in getRoutAjax.
                    window.aodAjax.getRouteAjax(href);
                }
                // Only redirect form Home or Programacion.
                else if ('undefined' !== typeof(idRuta) && 0 === idRuta.indexOf('home')) {
                    href.pathname = '/emisora/' + ev.data + '/';

                    // Every recirections from player will change the page. Don't need the second parameter in getRoutAjax.
                    window.aodAjax.getRouteAjax(href);
                }
                else if ('undefined' !== typeof(idRuta) && 0 === idRuta.indexOf('programacion')) {
                    href.pathname = '/programacion/' + ev.data + '/';

                    // Every recirections from player will change the page. Don't need the second parameter in getRoutAjax.
                    window.aodAjax.getRouteAjax(href);
                }

                window.player.setLoading(true);
                window.player.changeStation(ev.data);
                window.player.setPlayingId(ev.data);

                // If station changes but actual page is not Home or Programacion, every links in main menu have to be
                // changed so they links to the urls with station ID included.
                window.player.updateMenuLinks();

                // Send SEO to player
                sendMetasToPlayer();

                break;
        }
    }

    function onAdHandler(ev) {
        switch (ev.type) {
            case emic.top.event.AdEvent.ON_AD_VIDEO_RESUME:
            case emic.top.event.AdEvent.ON_AD_VIDEO_START:
            case emic.top.event.AdEvent.ON_AD_INSTREAM_START:
                window.player.ads = true;

                if (ev.type === emic.top.event.AdEvent.ON_AD_VIDEO_START ||
                    ev.type === emic.top.event.AdEvent.ON_AD_INSTREAM_START) {
                    window.player.setLoading(false);
                }

                if (ev.type === emic.top.event.AdEvent.ON_AD_VIDEO_START) {
                    window.player.prads = true;
                }

                break;
            case emic.top.event.AdEvent.ON_AD_VIDEO_PAUSE:
                break;
            case emic.top.event.AdEvent.ON_AD_VIDEO_SKIP:
            case emic.top.event.AdEvent.ON_AD_VIDEO_END:
            case emic.top.event.AdEvent.ON_AD_INSTREAM_END:
                window.player.ads = false;
                window.player.prads = false;
                break;
        }

        if (window.player.ads) {
            $('footer div.container div.preRoll').removeClass('hide');
        }
        else {
            $('footer div.container div.preRoll').addClass('hide')
        }

        if (window.player.prads) {
            $('#preAds').addClass('ads');
            $('#instreamAds').removeClass('ads');
        }
        else {
            $('#preAds').removeClass('ads');
            $('#instreamAds').addClass('ads');
        }
    }

    function sendMetasToPlayer() {
        var metas = window.player.getMetas();
        var metasSeo = {
            'title' : metas.title ? metas.title : '',
            'og_title' : metas.og_title ? metas.og_title : metas.title,
            'twitter_title' : metas.twitter_title ? metas.twitter_title : metas.title,
            'description' : metas.description ? metas.description : '',
            'og_description' : metas.og_description ? metas.og_description : metas.description,
            'twitter_description' : metas.twitter_description ? metas.twitter_description : metas.description,
            'app_id' : metas.facebook_app_id ? metas.facebook_app_id : ''
        };

        window.player.skinPlayer.externalOrder('metas_seo_facebook', metasSeo);
    }

    function sendIdPlaylistToPlayer(media) {
        // Only send externalOrder to player if it is a playlist.
        var idRuta = window.player.getIdRuta();
        if ('undefined' !== typeof(idRuta) && ('playlist' === idRuta || 'widget_playlist' === idRuta)) {
            var idPlaylist = {
                'id' : media
            };

            window.player.skinPlayer.externalOrder('id_playlist', idPlaylist);
        }
    }

    $(document).ready( function() {
        if (window.player.isMobile()) {
            $('#page-loader').addClass('cargando');
        }
        initPlayer({"dev":false,"id_container":"top_player","id_cuenta":"cadenadial","id_media":"cadenadial","id_player":256,"id_player_widget":257,"media_type":"audio","overwriteWidth":640,"overwriteHeight":515,"topPlayer":{"ad":{"container":"preAds"},"media":{"autoplay":true,"controllerData":{"container_banner_bigbox":"instreamAds","banner-live_synced_leaderboard":"instreamAds"}}}}, 'cadenadial', 'widget_directo', false, 'cadenadial', {"title":"Escucha Cadena Dial en directo - M\u00fasica en espa\u00f1ol | Widget","description":"Cadena Dial en directo, la mejor emisora de m\u00fasica en espa\u00f1ol. \u00a1Escucha online las canciones y los programas m\u00e1s divertidos de la radio musical!","directo_prefix_title":"Escucha ","directo_sufix_title":" en directo - M\u00fasica en espa\u00f1ol","directo_prefix_description":null,"directo_sufix_description":" en directo, la mejor emisora de m\u00fasica en espa\u00f1ol. \u00a1Escucha online las canciones y los programas m\u00e1s divertidos de la radio musical!","a_la_carta_title":"A la carta: podcast de todos los programas de Cadena Dial","a_la_carta_description":"A la carta: escucha online los podcasts de tus programas favoritos de Cadena Dial. Toda la m\u00fasica, entrevistas y la mejor lista musical de la radio","programacion_prefix_title":"Programaci\u00f3n de ","programacion_sufix_title":", radio musical en directo","programacion_prefix_description":"Los programas de ","programacion_sufix_description":" en directo. Horario de los programas de radio Atr\u00e9vete, Dial Tal Cual y Dej\u00e1te Llevar con la mejor m\u00fasica en espa\u00f1ol actual.","emisora_audios_prefix_title":"Escucha los audios y podcast de ","emisora_audios_prefix_description":"Escucha el podcast de tus programas preferidos de ","emisora_audios_sufix_description":". Descubre todos los audios con noticias, entrevistas y novedades musicales en espa\u00f1ol","programa_prefix_title":"Escucha ","programa_sufix_title":", podcast y directo del programa de radio.","programa_prefix_description":"Escucha el podcast de ","programa_sufix_description":". Accede a todos audios con los mejores momentos del programa de radio musical","sitemap_title":"Mapa Web Cadena Dial, radio en directo","sitemap_description":"Accede desde nuestro Mapa Web a la programaci\u00f3n de radio, emisoras en directo, audios, m\u00fasica en espa\u00f1ol online y podcasts de programas en Cadena Dial.","tag_prefix_title":"Escucha los audios de ","tag_sufix_title":" a la carta | Cadena Dial","tag_prefix_description":"Escucha online los audios sobre ","tag_sufix_description":". Disfruta de la playlist a la carta con todos los audios y podcasts de Cadena Dial.","keywords":null,"author":"Cadena Dial","fb_type":"music.radio_station","fb_app_id":null,"fb_article_publisher":"https:\/\/www.facebook.com\/cadenadial?ref=hl","publisher":null,"app_name":"Cadena Dial Espa\u00f1a en directo","twitter_card":"summary_large_image","twitter_site":"Cadena_Dial","og_title":"Escucha Cadena Dial en directo - M\u00fasica en espa\u00f1ol","twitter_title":"Escucha Cadena Dial en directo - M\u00fasica en espa\u00f1ol","og_description":"Cadena Dial en directo, la mejor emisora de m\u00fasica en espa\u00f1ol. \u00a1Escucha online las canciones y los programas m\u00e1s divertidos de la radio musical!","twitter_description":"Cadena Dial en directo, la mejor emisora de m\u00fasica en espa\u00f1ol. \u00a1Escucha online las canciones y los programas m\u00e1s divertidos de la radio musical!","facebook_app_id":940758659354343});
    });
</script>