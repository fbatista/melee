require "./lib/init"

disable :logging
set :root, File.dirname(__FILE__) + "/../"

get "/" do
	File.readlines("public/index.html")
end

# session index
get "/ideas" do
	content_type "application/json"
	[{"id" => 1, "title" => "Reciclar o lixo"}, {"id" => 2, "title" => "Comprar capsulas nespresso"}].to_json
end

post "/ideas" do
	
end

# a specific session
get "/sessions/:id" do

end

