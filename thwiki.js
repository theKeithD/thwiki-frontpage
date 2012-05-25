var baseURL;

/* Wait for 500ms of no input before checking the MediaWiki API for search suggestions */
var entryTimeout;
var entryDelay = 500;

/* Used for suggestion focus tracking. */
var curItem = 1; 

/* Behold, the clump of data that so much of this page depends on. */
var langTitles = new Object;
langTitles['en'] = ["Touhou Wiki", "English", "Search Touhou Wiki"];
langTitles['es'] = ["Touhou Wiki", "Español", "Buscar Touhou Wiki"];
langTitles['fr'] = ["Touhou Wiki", "Français", "Rechercher Touhou Wiki"];
langTitles['it'] = ["Touhou Wiki", "Italiano", "Cerca Touhou Wiki"];
langTitles['ko'] = ["동방프로젝트 위키", "한국어", "동방프로젝트 위키 내 검색"];
langTitles['nl'] = ["Touhou Wiki", "-", "Search Touhou Wiki"];
langTitles['pl'] = ["Touhou Wiki", "Polski", "Szukaj Touhou Wiki"];
langTitles['pt'] = ["Touhou Wiki", "Português", "Pesquisa Touhou Wiki"];
langTitles['ru'] = ["Touhou-Wiki", "Русский", "Поиск Touhou-Wiki"];
langTitles['sv'] = ["Touhou-wikin", "Svenska", "Sök Touhou-wikin"];
langTitles['uk'] = ["ТохоВікі", "Українська", "Пошук ТохоВікі"];
langTitles['zh'] = ["东方维基", "中文", "搜索东方维基"];

/* Images that aren't used in the page's initial state */
var imagesToPreload = ['go.png'];

/* An at-a-glance view of this script. The nasty guts are all down below. */
$(document).ready(function() {
    preloadContent(imagesToPreload);
    makeLangAnchorsObvious();
    prepareSearchQueryBox();
    addSearchButtonListeners();
    addLanguageUpdateListeners();
    addQueryTextChangeListener();
    addLiveSuggestionListeners();
    fiveSevenThree();
});

/* Simple preloader, used for just a few images */
function preloadContent(images) {
    $(images).each(function() {
        $('<img/>')[0].src = this;
    });
}

/* Make the distinction between the anchor and the surrounding li as obvious as feasibly possible.
 * They serve two very different functions.
 */
function makeLangAnchorsObvious() {
    recountTabindex();
    
    $('.wikiLang a').width('auto');
    $('.wikiLang a').height('auto');
    
    $('.wikiLang a').bind('focus mouseenter', function() {
        $(this).parent().addClass('anchorFocus');
    });
    $('.wikiLang a').bind('blur mouseleave', function() {
        $(this).parent().removeClass('anchorFocus');
    });
}
function recountTabindex() {
    var tabindex = 1
    
    $('.wikiLang').each(function() {
        $(this).attr('tabindex', tabindex);
        tabindex++;
        $(this).children('a').first().attr('tabindex', tabindex);
        tabindex++;
    });
    
    $('#search-query').attr('tabindex', tabindex);
    tabindex++;
    $('#search-button').attr('tabindex', tabindex);
}


/* Here, have a little treat. */
function fiveSevenThree() {
    var target = [38,38,40,40,37,39,37,39];
    var input = [];
    
    $(document).keydown(function (e) {
        if(e.which >= 37 && e.which <= 40) {
            input.push(e.which);
            if(input.length > target.length) { // don't want it getting too long, now
                input.shift();
            }
            
            if(input.toString().indexOf(target) == 0) { // access granted, please proceed to the next area
                $(this).unbind('keydown');
                $.getScript('swfobject.js', theNextArea);
            }
        }
    });
}
function theNextArea() {
    $('#wiki-langs').hide();
    
    $('#wiki-content').append("<div id='tick-tock'></div>");
    $('#tick-tock').append("<div id='tick-tock-stop' tabindex='1'>close</div>");
    $('#tick-tock').append("<div id='tick-tock-clock'></div>");
    
    $('#tick-tock-stop').click(abortMission);
    $('#tick-tock-stop').keydown(function(e) {
        if(e.which == 13) { // enter
            abortMission();
        }
    });
    $(document).keydown(function(e) {
        if(e.which == 27) { // escape
            abortMission();
        }
    });
    
    swfobject.embedSWF( 'http://boxell.jp/clock/tohoclock.swf', 'tick-tock-clock', 
                        '100%', Math.floor($('#wiki-content').width() / (4/3)), // keep in 4:3 AR, scale to width of div 
                        '10.0.0');
}
function abortMission() {
    $(document).unbind('keydown');
    $('#tick-tock').remove();
    $('#wiki-langs').show();
    fiveSevenThree(); // run it back
}


/* Search bar - Query box 
 * ...yes, seriously, pretty much the rest of this script is focused on the search bar.
 */
function prepareSearchQueryBox() {
    $('#search-query').focus(function() {
        $('#search-placeholder').hide();
    });
    $('#search-query').blur(function() {
        if($(this).val() == '') {
            $('#search-placeholder').show();
        } else {
            $('#search-placeholder').hide();
        }
        closeSuggestionsList();
    });

    // placeholder text likes to get in the way of clicking, this gets around it
    $('#search-placeholder').focus(function() {
        $(this).blur();
        $('#search-query').focus();
        
    });
    $('#search-placeholder').click(function() {
        $(this).blur();
        $('#search-query').focus();
    });
    
    // prime the search bar and get baseURL set properly
    updateSelectedWikiLang($('#search-container').attr('lang'));
    updateSearchBar($('#search-container').attr('lang'));
}


/* Search bar - Updating current language */
function addLanguageUpdateListeners() {
    $('.wikiLang').click(selectLanguageFromWikiLang);
    $('.wikiLang').keydown(function(e) {
        if(e.which == 13) { // enter
            e.preventDefault();
            e.stopPropagation();
            selectLanguageFromWikiLang(e);
        } else {
            return;
        }
    });
}
function selectLanguageFromWikiLang(e) {
    var curLangCode = $(e.target).children('a').first().attr('lang');
    
    updateSelectedWikiLang(curLangCode);
    updateSearchBar(curLangCode);
    
    $('#search-query').focus();
}
function updateSearchBar(curLangCode) {
    // update text associated with search bar tooltip and placeholder
    $('#search-container').attr('title', langTitles[curLangCode][2] + ' (' + langTitles[curLangCode][1] + ')');
    $('#search-placeholder').text(langTitles[curLangCode][2]);
    
    // update language indicator
    $('#search-language').text(langTitles[curLangCode][1]);
    
    // update search form action and language
    var actionURL;
    if(curLangCode == "fr") { 
        baseURL = 'http://touhou.net/thwiki/';
    } else {
        baseURL = 'http://' + curLangCode + '.touhouwiki.net/';
    }
    actionURL = baseURL + 'index.php?title=Special:Search';
    $('#search-container form').attr('action', actionURL);
    $('#search-container').attr('lang', curLangCode);
}
function updateSelectedWikiLang(curLangCode) {
    if($('.wikiLang.selected')) {
        $('.wikiLang.selected').removeClass('selected');
    }
    $('.wikiLang a[lang="' + curLangCode + '"]').parent().addClass('selected');
    
    // update header title
    if(curLangCode == 'sv') $('#wiki-title').css('width', '7em');
    else if(curLangCode == 'zh' || curLangCode == 'uk') $('#wiki-title').css('width', '4.4em');
    else if(curLangCode == 'ko') $('#wiki-title').css('width', '8.5em');
    else $('#wiki-title').css('width', '6.5em');
    $('#wiki-title').text(langTitles[curLangCode][0]);
}


/* Search bar - Submit button */
function addSearchButtonListeners() {
    $('#search-button').bind('focusin mouseenter', function() {
        $(this).children().css('background-position', '0px -13px');
    });
    $('#search-button').bind('focusout mouseleave', function() {
        $(this).children().css('background-position', '0px 0px');
    });
}


/* Search bar - Suggestions */
function addQueryTextChangeListener() {
    $('#search-query').bind('textchange', function() {
        clearTimeout(entryTimeout); // user still typing, keep timer alive
        
        entryTimeout = setTimeout(function() {
            if($('#search-query').val() == '') {
                $('#search-query').empty();
                closeSuggestionsList();
            } else {
                mediaWikiOpenSearchAPICall();
            }
        }, entryDelay);
    });
}

/* Choose suggestion by clicking */    
function addLiveSuggestionListeners() {
    $('#search-suggestions').delegate('div', 'click', function() {
        $('#search-query').unbind('textchange');
        $('#search-query').val($(this).text());
        closeSuggestionsList();
        $('#search-container form').submit();
    });
}

/* Venture out into the vast expanses of the world wide web... */
function mediaWikiOpenSearchAPICall() {
    var apiCall = 'api.php';
    var suggestionsAPICallURL = baseURL + apiCall;
    var suggestions = $.ajax({
        type: 'GET',
        data: { 'action': 'opensearch',
                'limit': '10',
                'format': 'jsonfm',
                'search': $('#search-query').val() },
        dataType: 'jsonp',
        jsonpCallback: 'populateSuggestions',
        url: suggestionsAPICallURL,
    });
}

/* ...and return with a small pile of suggestions. */
function populateSuggestions(data) {
    $('#search-suggestions').empty();
    $.each(data[1], function (i, val) {
        var suggestionDiv = '<div id=\'search-suggestion-' + (i+1) +'\' class=\'search-suggestion\'>' + val + '</div>'
        $('#search-suggestions').append(suggestionDiv);
    });
    openSuggestionsList();
}

/* There here's a fun little ball of input handling! */
function suggestionsKeyboardNav(e) { 
    if(e.which == 9 || e.which == 13 || e.which == 27 || (e.which >= 37 && e.which <= 40)) { // only handle these certain inputs
        e.preventDefault();
        e.stopPropagation();
    } else {
        return;
    }
    
    var suggestions = $('#search-suggestions').children();
    var maxItems = suggestions.length;
    
    switch(e.which) { // special key inputs
        case 9:  // tab, choose 1st or selected suggestion
            if(suggestions.hasClass('selected')) {
                $('#search-query').val($('#search-suggestions .selected').text());
            } else if($('#search-suggestion-1')) {
                $('#search-query').val($('#search-suggestion-1').text());
            }
            closeSuggestionsList();
            $('#search-languages').focus();
            break;
        case 13: // enter, choose selected suggestion and submit search
            $('#search-query').unbind('textchange');
            if(suggestions.hasClass('selected')) {
                $('#search-query').val($('#search-suggestions .selected').text());
            }
            $('#search-container form').submit();
            closeSuggestionsList();
            break;
        case 27: // escape, close suggestions list
            closeSuggestionsList();
            break;
    }

    
    if(suggestions.hasClass('selected')) { // arrow key inputs
        clearSelectedSuggestion();
    
        switch(e.which) {
            case 37: case 38: // left, up
                if(curItem <= 1) {
                    curItem = maxItems;
                } else {
                    curItem--;
                }
                $('#search-suggestion-' + curItem).addClass('selected');
                break;
            case 39: case 40: // right, down
                if(curItem >= maxItems) {
                    curItem = 1;
                } else {
                    curItem++;
                }
                $('#search-suggestion-' + curItem).addClass('selected');
                break;
        }
    } else { // no item currently selected
        switch(e.which) {
            case 38: // up
                suggestions.last().addClass('selected');
                curItem = maxItems;
                break;
            case 40: // down
                suggestions.first().addClass('selected');
                cutItem = 1;
                break;
        }
    } 
}

/* Clear the 'selected' class from all suggestions */
function clearSelectedSuggestion() {
    $('#search-suggestions').children().each(function() {
        $(this).removeClass('selected');
    });
}

/* Convenience methods for setting up and tearing down the suggestions list */
function closeSuggestionsList() {
    $('#search-suggestions').slideUp();
}
function openSuggestionsList() {
    curItem = 1;
    $('#search-query').unbind('keydown');
    $('#search-suggestions').children().unbind('mouseenter');
    $('#search-suggestions').slideDown();
    $('#search-query').keydown(suggestionsKeyboardNav);
    $('#search-suggestions').children().mouseenter(function() {
        clearSelectedSuggestion();
        $(this).addClass('selected');
        curItem = parseInt($(this).attr('id').split('-')[2]);
    });
}
