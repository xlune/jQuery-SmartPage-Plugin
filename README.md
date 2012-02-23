#jQuery SmartPage Plugin

[blog(ja)](http://blog.xlune.com/2011/05/jquerysmartpage.html "Blog")

----
###USAGE EXAMPLE

    $(document).smartPage({
        useHistoryState: true,
        useHash: true,
        endPoint: "http://blog.xlune.com/",
        fixedEndPoint: true,
        fragment: "#!",
        useIE9: false,
        pageRules: [
                [/^https?:\/\/blog\.xlune\.com\//i, true],
                [/(\/|\.html)((\?|#).*)?$/i, true],
                [/\/vgrid\//i, false],
                [/\/gcomplete\//i, false]
        ],
        baseList: [
                "title",
                "meta[property='og:title']",
                "meta[property='og:url']",
                "link[rel='canonical']",
                "#contents > article"
        ],
        insertList: [
                "title",
                "meta[property='og:title']",
                "meta[property='og:url']",
                "link[rel='canonical']",
                "#contents > article"
        ],
        scriptDelay: 100,
        useFragmentClear: true,
        
        useCSSFade: true,
        useFade: true,
        useScrollTop: true,

        onStart: function(){/*any*/},
        onChange: function(){/*any*/},
        onComplete: function(){/*any*/},
        onScriptComplete: function(){/*any*/},
        onError: function(){/*any*/}
    });
