require "rubygems"
require "isolate/now"
require "sinatra"
require "json"
require "redis"
require "erb"
require 'sinatra/bundles'

$redis = Redis.new
