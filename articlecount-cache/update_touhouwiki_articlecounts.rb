#/usr/bin/env ruby
require 'rubygems'
require 'open-uri'
require 'json'

Dir.chdir(File.dirname(__FILE__))

langs = { "de" => {},
          "en" => {},
          "es" => {},
          "fr" => { "external" => true, "base_url" => "http://touhou.net/thwiki/" },
          "it" => { "inactive" => true },
          "ko" => {},
          "nl" => {},
          "pl" => {},
          "pt" => { "inactive" => true },
          "ru" => {},
          "sv" => { "inactive" => true },
          "uk" => { "inactive" => true },
          "zh" => {} };
article_counts = {}
request_call = "api.php?action=query&meta=siteinfo&siprop=statistics&format=json";

langs.each do |lang, props|
  if props.key?("inactive")
    next
  end
  
  if props.key?("external") and props.key?("base_url")
    base_url = props["base_url"]
  else
    base_url = "http://#{lang}.touhouwiki.net/"
  end
  
  print "Getting stats for #{lang}... "
  json = open(base_url << request_call) do |response|
    JSON.load(response)
  end
  
  article_counts[lang] = json["query"]["statistics"]["articles"]
  print "#{article_counts[lang]} articles.\n"
end

print "Writing to article_counts.json... "
File.open('article_counts.json', 'w') do |f|
  JSON.dump(article_counts, f)
end
print "DONE!\n"
