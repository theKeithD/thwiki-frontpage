<!DOCTYPE html>
<html lang='mul' dir='ltr'>
<head>
    <meta charset='utf-8' />
    <title>Touhou Wiki</title>
    <meta name='description' content='Touhou Wiki covers the games and any official and fan-made material based on the Touhou series.' /> 
    <meta name='author' content='K' />
    <meta name="robots" content="index, follow" />
    <link rel='shortcut icon' href='favicon.ico' />
    <link rel='stylesheet' href='mainPage.css' media='screen' /> 
</head>
<body>
<?php
    $langs = array( "en" => array("langCode"=>"en", "lang"=>"English", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"articles", "articleCount"=>"0",
                                  "searchText" => "Search Touhou Wiki"), 
                    "es" => array("langCode"=>"es", "lang"=>"Español", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"artículos", "articleCount"=>"0",
                                  "searchText" => "Buscar Touhou Wiki"),
                    "fr" => array("langCode"=>"fr", "lang"=>"Français", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"articles", "articleCount"=>"0",
                                  "searchText" => "Rechercher Touhou Wiki",
                                  "external" => true, "baseURL" => "http://touhou.net/thwiki/"), // France is a very different country with a very different site
                    "it" => array("langCode"=>"it", "lang"=>"Italiano", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"voci", "articleCount"=>"-1",
                                  "searchText" => "Cerca Touhou Wiki",
                                  "inactive" => true),
                    "ko" => array("langCode"=>"ko", "lang"=>"한국어", "desc"=>"동방프로젝트 위키", 
                                  "articlesName"=>"개의 문서", "articleCount"=>"0",
                                  "searchText" => "동방프로젝트 위키 내 검색",
                                  "noAPICheck" => true),
                    "nl" => array("langCode"=>"nl", "lang"=>"Nederlands", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"-", "articleCount"=>"0",
                                  "searchText" => "Search Touhou Wiki-",
                                  "noAPICheck" => true),
                    "pl" => array("langCode"=>"pl", "lang"=>"Polski", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"haseł", "articleCount"=>"0", // this is alright unless the article count ends in 1, 2, 3, or 4
                                  "searchText" => "Szukaj Touhou Wiki"),
                    "pt" => array("langCode"=>"pt", "lang"=>"Português", "desc"=>"Touhou Wiki", 
                                  "articlesName"=>"artigos", "articleCount"=>"-1",
                                  "searchText" => "Pesquisa Touhou Wiki",
                                  "inactive" => true),
                    "ru" => array("langCode"=>"ru", "lang"=>"Русский", "desc"=>"Touhou-Wiki", 
                                  "articlesName"=>"статей", "articleCount"=>"0", // this is alright unless the article count ends in 1, 2, 3, or 4
                                  "searchText" => "Поиск Touhou-Wiki"),
                    "sv" => array("langCode"=>"sv", "lang"=>"Svenska", "desc"=>"Touhou-wikin", 
                                  "articlesName"=>"artiklar", "articleCount"=>"-1",
                                  "searchText" => "Sök Touhou-wikin",
                                  "inactive" => true),
                    "uk" => array("langCode"=>"uk", "lang"=>"Українська", "desc"=>"ТохоВікі", 
                                  "articlesName"=>"статей", "articleCount"=>"-1", // this is alright unless the article count ends in 1, 2, 3, or 4
                                  "searchText" => "Пошук ТохоВікі",
                                  "inactive" => true),
                    "zh" => array("langCode"=>"zh", "lang"=>"中文", "desc"=>"东方维基", 
                                  "articlesName"=>"条目", "articleCount"=>"0",
                                  "searchText" => "搜索东方维基"));    
    
    $requestCall = "api.php?action=query&meta=siteinfo&siprop=statistics&format=xml";
    $numLangs = sizeof($langs);
    
    $userLang = substr($_SERVER["HTTP_ACCEPT_LANGUAGE"], 0, 2);
    if(!array_find_r($userLang, $langs)) { // assume English if we can't find their language in the list
        $userLang = "en";
    }
    
    $headerWidth = "6.5em";
    if($userLang == "zh" || $userLang == "uk") $headerWidth = "4.4em";
    else if($userLang == "sv") $headerWidth = "7em";
    else if($userLang == "ko") $headerWidth = "8.5em";
?>
    <!-- Header -->
    <div id='wiki-logo'></div>
    <div id='wiki-title' style='width: <?php echo $headerWidth ?>'><?php echo $langs[$userLang]["desc"]?></div>
    <!-- Language listing -->
    <div id='wiki-content'>
    <ul id='wiki-langs'>
<?php
        // populate article counts
        foreach($langs as &$lang) {
            if($lang["inactive"] || $lang["noAPICheck"]) {
                continue;
            }
            if($lang["external"] && $lang["baseURL"]) $baseURL = $lang["baseURL"];
            else $baseURL = "http://" . $lang["langCode"] . ".touhouwiki.net/";
            
            $curl = curl_init("" . $baseURL . $requestCall);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true );
            curl_setopt($curl, CURLOPT_TIMEOUT, 5 );
            
            $apiResponse = curl_exec($curl);
            $apiResponse = @mb_convert_encoding($apiResponse, 'HTML-ENTITIES', 'utf-8');
            $httpStatus = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            curl_close($curl);
            
            // TODO: Implement alternate/more effective sanity check. (200 OK is received even when the URL doesn't exist, which results in parsing errors)
            if($httpStatus == "200") {
                $domAPI = new DomDocument();
                $domAPI->loadXML($apiResponse);
            
                $lang["articleCount"] = $domAPI->documentElement->getElementsByTagName('query')->item(0)->getElementsByTagName('statistics')->item(0)->attributes->getNamedItem('articles')->nodeValue; // behold, an article count!
            }
        }
        unset($lang);

        // sort languages according to article count
        uasort($langs, "compare_articles");
        
        $curLang = 0;
        $tabindex = 0;

        foreach($langs as &$lang) {
            // we wait until after sorting to make it pretty
            $lang["articleCount"] = number_format($lang["articleCount"]);
            
            /* Languages such as Russian and Polish have some different rules for plurals and numbers.
             * The last digit must be checked.
             */
            if($lang["langCode"] == "ru" || $lang["langCode"] == "uk") { 
              switch(substr($lang["articleCount"], -1)) {
                case "1": 
                  if($lang["langCode"] == "ru") {
                    $lang["articlesName"] = "статья";
                  }
                  if($lang["langCode"] == "uk") {
                    $lang["articlesName"] = "стаття";
                  }
                  break;
                case "2": 
                case "3":
                case "4":
                  if($lang["langCode"] == "ru") {
                    $lang["articlesName"] = "статьи";
                  }
                  if($lang["langCode"] == "uk") {
                    $lang["articlesName"] = "статті";
                  }
                  break;
                default: // not entirely necessary, but...
                  $lang["articlesName"] = "статей";
              }
            } 
            if($lang["langCode"] == "pl") { 
              if($lang["articleCount"] == "1") { 
                $lang["articlesName"] = "hasło";
              } else {
                switch(substr($lang["articleCount"], -1)) {
                  case "2": 
                  case "3":
                  case "4":
                      if(substr($lang["articleCount"], -2, 1) != "1") {
                          $lang["articlesName"] = "hasła";
                    } else {
                      $lang["articlesName"] = "haseł";
                    }
                    break;
                  default:
                    $lang["articlesName"] = "haseł";
                    break;
                }
              }
            }
            
            
            if($lang["external"] == true && $lang["baseURL"] == true) $baseURL = $lang["baseURL"];
            else $baseURL = "http://" . $lang["langCode"] . ".touhouwiki.net/";

            $curLang++;
            $tabindex++;
        
            // Custom shaping
            $customStyle = "";
            $minRowWidth = 280;
            switch($curLang) {
                case 3:
                case 5:
                case 6:
                case 8:
                    $customStyle .= " style='width: 33%; min-width: " . floor($minRowWidth/3) . "px;'"; // rows 2 and 3 have 3 items 
                case 4:
                case 7:
                    $customStyle .= " style='width: 34%; min-width: " . floor($minRowWidth/3) . "px;'"; // rows 2 and 3 have 3 items (middle items are slightly wider to make it add up to 100)
                case 9:
                case 10:
                case 11:
                case 12:
                    $customStyle .= " style='width: 25%; min-width: " . floor($minRowWidth/4) . "px; font-size: 70%; margin-top: 1em;'"; // row 4 has 4 items and has smaller text
            }
            
            // Actual HTML
            echo "        <li class='wikiLang'$customStyle><a id='wiki$curLang' lang='" . $lang["langCode"] . "'\n          href='$baseURL' title='" . $lang["lang"] . " - " . $lang["desc"] . "' tabindex='$tabindex'>\n";
            echo "            <div class='langName'>" . $lang["lang"] . "</div>\n";
            if(!$lang["inactive"]) {
                echo "            <div class='articles'>" . $lang["articleCount"];
                if($lang["langCode"] != "ko") { // Korean value for articlesName includes a counter word attached to the number, so the space shouldn't be added
                echo " ";
                }
                echo $lang["articlesName"] . "</div>\n";
            }
            echo "        </a></li>\n";
        }
        unset($lang);
        
        // custom compare for uasort()
        // larger articleCount wins
        // in the event of a tie, sort by language name
        function compare_articles($a, $b) { // the larger article count wins
            if ($a["articleCount"] == $b["articleCount"]) {
                if($a["lang"] == $b["lang"]) {
                    return 0;
                }
                return ($a["lang"] < $b["lang"]) ? -1 : 1;
            }
            return ($a["articleCount"] < $b["articleCount"]) ? 1 : -1;
        }
        
        // from Bandit Design
        // array_search with recursive searching, optional partial matches and optional search by key
        function array_find_r($needle, $haystack, $partial_matches = false, $search_keys = false) {
            if(!is_array($haystack)) return false;
            foreach($haystack as $key=>$value) {
                $what = ($search_keys) ? $key : $value;
                if($needle===$what) return $key;
                else if($partial_matches && @strpos($what, $needle)!==false) return $key;
                else if(is_array($value) && array_find_r($needle, $value, $partial_matches, $search_keys)!==false) return $key;
            }
            return false;
        }
        ?>
    </ul>
    </div>
    <!-- Search bar -->
    <div id='search-container' title='<?php echo $langs[$userLang]["searchText"] . " (" . $langs[$userLang]["lang"] . ")"; ?>' lang='<?php echo $userLang; ?>'><form action='http://<?php echo $userLang; ?>.touhouwiki.net/wiki/Special:Search'>
        <fieldset id="search-bar">
            <div id='search-section-right'>
                <div id='search-language'><?php echo $langs[$userLang]["lang"]; ?></div>
                <button id='search-button' type='submit' value='Search' tabindex='<?php echo $tabindex + 2; ?>'><div></div></button>
            </div>
            <div id='search-section-left'>
                <input id='search-query' type='text' name='search' autocomplete='off' autofocus='autofocus' tabindex='<?php echo $tabindex + 1; ?>' />
                <label id='search-placeholder'><?php echo $langs[$userLang]["searchText"]; ?></label>
                <div id='search-suggestions'></div>
            </div>
        </fieldset>
    </form></div>
    
    <!-- Scripts of all sorts -->
    <script src='jquery-and-plugins.js' type='text/javascript'></script>
    <script src='thwiki.js' type='text/javascript'></script>
</body>
</html>
