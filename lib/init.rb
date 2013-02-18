Dir['./lib/isolate*/lib'].each do |dir|
  $: << dir
end

require "rubygems"
require "isolate/now"
require "sinatra"
require "json"
require "redis"
require "erb"
require 'sinatra/bundles'

$redis = Redis.new
