extends CanvasLayer

# Signals
signal world_selected(world_data)
signal back_pressed

func _input(event):
	# DEBUG: Input handling and visual feedback
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		print("Mouse clicked at: ", event.position)
		
		# Check if clicked on a node
		for node in map_nodes:
			if is_instance_valid(node):
				var button = node.get_node("Button")
				if button and button.get_global_rect().has_point(event.position):
					print("Clicked on node: ", node.world_data.get("name", "unnamed"))
					_on_node_pressed(node)
					return
		
		# Check if clicked on back button
		if $BackButton and $BackButton.get_global_rect().has_point(event.position):
			print("Back button clicked")
			_on_back_button_pressed()
			return
		
		# Check if clicked on enter button when details panel is visible
		if $WorldDetailsPanel.visible and $WorldDetailsPanel/EnterButton and $WorldDetailsPanel/EnterButton.get_global_rect().has_point(event.position):
			print("Enter button clicked")
			_on_enter_button_pressed()
			return
	
	# DEBUG: Keyboard shortcuts for testing
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_B:  # 'B' for Back
			print("Back key pressed")
			_on_back_button_pressed()
		elif event.keycode == KEY_SPACE:  # Space for selecting first accessible world
			for node in map_nodes:
				if is_instance_valid(node) and is_node_accessible(node):
					print("Selected world with keyboard: ", node.world_data.get("name", "unnamed"))
					_on_node_pressed(node)
					break
		elif event.keycode == KEY_ENTER and selected_node != null:  # Enter to confirm selection
			print("Enter key pressed with selection")
			_on_enter_button_pressed()



# Constants
const NODE_SCENE = preload("res://scenes/world_map_node.tscn")
const NODE_CONNECTION_WIDTH = 3
const MIN_NODE_DISTANCE = 150
const MAX_NODE_DISTANCE = 250

# Map configuration
var map_width = 1000
var map_height = 500
var levels_per_map = 4
var branching_factor = 2  # How many options per level

# Run state
var current_run_data = {
	"towers": [],
	"npcs": [],
	"gold": 200,
	"completed_worlds": [],
	"available_worlds": []
}

# Current map data
var map_nodes = []
var node_connections = []
var selected_node = null
var current_level = 0  # Starting from 0 for the first level

# World types and variations
var world_types = [
	{
		"id": "defense",
		"name": "Defense Outpost",
		"description": "Standard defense mission. Protect your base from waves of enemies.",
		"waves": [3, 5, 7],  # Easy, Medium, Hard
		"rewards": {
			"gold": [100, 150, 200],
			"towers": [0, 1, 1],
			"npcs": [1, 1, 2]
		}
	},
	{
		"id": "rescue",
		"name": "Rescue Mission",
		"description": "Save trapped NPCs or repair broken towers while defending.",
		"waves": [3, 4, 6],
		"rewards": {
			"gold": [50, 100, 150],
			"towers": [1, 1, 2],
			"npcs": [2, 3, 4]
		}
	},
	{
		"id": "scavenge",
		"name": "Scavenge Zone",
		"description": "Collect resources with fewer but tougher enemies.",
		"waves": [2, 3, 4],
		"rewards": {
			"gold": [200, 300, 400],
			"towers": [0, 1, 1],
			"npcs": [0, 1, 1]
		}
	},
	{
		"id": "elite",
		"name": "Elite Challenge",
		"description": "Face stronger enemies for better rewards.",
		"waves": [4, 6, 8],
		"rewards": {
			"gold": [200, 300, 400],
			"towers": [1, 2, 2],
			"npcs": [2, 2, 3]
		}
	},
	{
		"id": "boss",
		"name": "Boss Encounter",
		"description": "A single difficult wave with a powerful boss enemy.",
		"waves": [1, 1, 1],  # Always just 1 wave, but different difficulties
		"rewards": {
			"gold": [300, 400, 500],
			"towers": [1, 2, 3],
			"npcs": [2, 3, 4]
		}
	}
]

# Special conditions that can be applied to worlds
var special_conditions = [
	{
		"id": "fast_enemies",
		"name": "Fast Enemies",
		"description": "Enemies move 50% faster."
	},
	{
		"id": "tough_enemies",
		"name": "Tough Enemies",
		"description": "Enemies have 50% more health."
	},
	{
		"id": "limited_resources",
		"name": "Limited Resources",
		"description": "Start with 50% less gold."
	},
	{
		"id": "fog_of_war",
		"name": "Fog of War",
		"description": "Reduced visibility range."
	},
	{
		"id": "night_mode",
		"name": "Night Mode",
		"description": "Darkness reduces visibility and enemies are harder to spot."
	}
]

func _ready():
	print("World map initialized")
	
	# Hide world details initially and ensure it doesn't block input
	$WorldDetailsPanel.visible = false
	$WorldDetailsPanel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	# Connect button signals with debug output
	print("Connecting button signals...")
	
	if $WorldDetailsPanel/EnterButton:
		$WorldDetailsPanel/EnterButton.pressed.connect(_on_enter_button_pressed)
		print("Connected EnterButton signal")
	else:
		print("ERROR: EnterButton not found")
	
	if $BackButton:
		$BackButton.pressed.connect(_on_back_button_pressed)
		print("Connected BackButton signal")
	else:
		print("ERROR: BackButton not found")
	
	# Update run info display
	update_run_info()
	
	# Generate the initial map
	generate_map()

func generate_map():
	print("Generating world map...")
	
	# Clear existing nodes
	for node in $MapNodes.get_children():
		node.queue_free()
	
	map_nodes.clear()
	node_connections.clear()
	
	# Calculate horizontal spacing
	var level_width = map_width / (levels_per_map + 1)
	
	# Create starting node (completed level)
	if current_level > 0:
		var start_node = NODE_SCENE.instantiate()
		start_node.position = Vector2(-level_width * 2, 0)
		start_node.setup({
			"id": "start",
			"name": "Previous World",
			"completed": true,
			"selectable": false
		})
		$MapNodes.add_child(start_node)
		map_nodes.append(start_node)
	
	# Generate nodes for each level
	for level in range(levels_per_map):
		var nodes_in_level = branching_factor
		if level == levels_per_map - 1:  # Last level always has one boss node
			nodes_in_level = 1
			
		var level_nodes = []
		
		# Calculate vertical spacing
		var vertical_spacing = map_height / (nodes_in_level + 1)
		
		# Create nodes for this level
		for i in range(nodes_in_level):
			var node_data = generate_world_data(level, i == 0 && level == levels_per_map - 1)
			
			var node = NODE_SCENE.instantiate()
			var x_pos = level_width * (level + 1)
			var y_pos = vertical_spacing * (i + 1) - map_height/2
			
			# Add some randomness to positions
			x_pos += randf_range(-level_width/4, level_width/4)
			y_pos += randf_range(-vertical_spacing/4, vertical_spacing/4)
			
			node.position = Vector2(x_pos, y_pos)
			node.setup(node_data)
			node.pressed.connect(_on_node_pressed.bind(node))
			print("Created node: ", node_data.name, " at position ", Vector2(x_pos, y_pos))
			
			$MapNodes.add_child(node)
			map_nodes.append(node)
			level_nodes.append(node)
			
			# Store the node data in our available worlds
			current_run_data.available_worlds.append(node_data)
		
		# Connect to previous level nodes
		if level > 0:
			var prev_level_nodes = []
			for node in map_nodes:
				if node.world_data.get("level", -1) == level - 1:
					prev_level_nodes.append(node)
			
			# Create connections
			for target_node in level_nodes:
				# Connect to 1-2 previous nodes
				var connections_to_make = 1 + int(randf() < 0.5)
				var available_sources = prev_level_nodes.duplicate()
				
				for i in range(min(connections_to_make, available_sources.size())):
					var source_index = randi() % available_sources.size()
					var source_node = available_sources[source_index]
					available_sources.remove_at(source_index)
					
					node_connections.append({
						"from": source_node,
						"to": target_node
					})
	
	# Update the visual connections
	update_map_connections()
	
	print("Map generation complete with ", map_nodes.size(), " nodes and ", node_connections.size(), " connections")

func update_map_connections():
	# Alle vorherigen Verbindungen löschen
	for node in map_nodes:
		if is_instance_valid(node) and node.has_method("clear_connections"):
			node.clear_connections()
	
	# Verbindungen neu erstellen
	for connection in node_connections:
		var from_node = connection.from
		var to_node = connection.to
		if is_instance_valid(from_node) and is_instance_valid(to_node):
			var completed = from_node.world_data.get("completed", false)
			if to_node.has_method("draw_connection_to"):
				to_node.draw_connection_to(from_node, completed)
	
	# Alle Nodes aktualisieren
	for node in map_nodes:
		if is_instance_valid(node):
			node.update_appearance()

func generate_world_data(level, is_boss = false):
	# Generate a random world configuration
	var world_type
	
	if is_boss:
		# Last level is always a boss
		world_type = world_types[4]  # Boss type
	else:
		# Randomly select a world type (excluding boss for non-final levels)
		var available_types = world_types.slice(0, 4)
		world_type = available_types[randi() % available_types.size()]
	
	# Determine difficulty (increases with level)
	var difficulty = min(level, 2)  # 0, 1, or 2 (Easy, Medium, Hard)
	
	# Randomly select a special condition (30% chance)
	var special = null
	if randf() < 0.3:
		special = special_conditions[randi() % special_conditions.size()]
	
	# Generate a unique ID for this world
	var world_id = world_type.id + "_" + str(level) + "_" + str(randi() % 1000)
	
	# Create the world data
	var world_data = {
		"id": world_id,
		"type": world_type.id,
		"name": world_type.name,
		"level": level + current_level,
		"difficulty": difficulty,
		"waves": world_type.waves[difficulty],
		"rewards": {
			"gold": world_type.rewards.gold[difficulty],
			"towers": world_type.rewards.towers[difficulty],
			"npcs": world_type.rewards.npcs[difficulty]
		},
		"special": special,
		"completed": false,
		"selectable": true
	}
	
	return world_data

func _on_node_pressed(node):
	print("Node pressed: ", node.world_data.get("name", "unnamed"))
	
	# Only allow selecting nodes that are connected to completed nodes
	if !is_node_accessible(node):
		print("Node not accessible")
		return
	
	print("Node is accessible, showing details")
	selected_node = node
	show_world_details(node.world_data)

func is_node_accessible(node):
	# First level nodes are always accessible
	if node.world_data.get("level", -1) == current_level:
		return true
	
	# Check if connected to any completed node
	for connection in node_connections:
		if connection.to == node and connection.from.world_data.get("completed", false):
			return true
	
	return false

func show_world_details(world_data):
	var panel = $WorldDetailsPanel
	panel.visible = true
	
	# Set up the panel content
	panel.get_node("Title").text = "World: " + world_data.name
	
	# Display difficulty as stars
	var stars = ""
	for i in range(5):
		if i <= world_data.difficulty:
			stars += "★"
		else:
			stars += "☆"
	panel.get_node("DifficultyLabel").text = "Difficulty: " + stars
	
	# Display waves
	panel.get_node("WavesLabel").text = "Waves: " + str(world_data.waves)
	
	# Display rewards
	var rewards_text = "Rewards: "
	if world_data.rewards.towers > 0:
		rewards_text += str(world_data.rewards.towers) + " Tower" 
		if world_data.rewards.towers > 1:
			rewards_text += "s"
		if world_data.rewards.npcs > 0:
			rewards_text += ", "
	
	if world_data.rewards.npcs > 0:
		rewards_text += str(world_data.rewards.npcs) + " NPC"
		if world_data.rewards.npcs > 1:
			rewards_text += "s"
	
	if world_data.rewards.gold > 0:
		if world_data.rewards.towers > 0 or world_data.rewards.npcs > 0:
			rewards_text += ", "
		rewards_text += str(world_data.rewards.gold) + " Gold"
		
	panel.get_node("RewardsLabel").text = rewards_text
	
	# Display special condition if any
	if world_data.special != null:
		panel.get_node("SpecialLabel").text = "Special: " + world_data.special.name
		panel.get_node("SpecialLabel").tooltip_text = world_data.special.description
		panel.get_node("SpecialLabel").visible = true
	else:
		panel.get_node("SpecialLabel").visible = false

func update_run_info():
	# Update the display of current run info
	$CurrentRunInfo/TowersLabel.text = "Towers: " + str(current_run_data.towers.size())
	$CurrentRunInfo/NPCsLabel.text = "NPCs: " + str(current_run_data.npcs.size())
	$CurrentRunInfo/GoldLabel.text = "Gold: " + str(current_run_data.gold)

func _on_enter_button_pressed():
	if selected_node != null:
		print("Enter button pressed with node: ", selected_node.world_data.get("name", "unnamed"))
		# Hide the details panel
		$WorldDetailsPanel.visible = false
		
		# Emit signal with the selected world's data
		emit_signal("world_selected", selected_node.world_data)

func _on_back_button_pressed():
	emit_signal("back_pressed")

func mark_world_completed(world_id):
	# Find the world in available worlds and mark it completed
	for i in range(current_run_data.available_worlds.size()):
		if current_run_data.available_worlds[i].id == world_id:
			current_run_data.available_worlds[i].completed = true
			current_run_data.completed_worlds.append(world_id)
			break
	
	# Find the corresponding node and update it
	for node in map_nodes:
		if node.world_data.id == world_id:
			node.world_data.completed = true
			node.update_appearance()
			break
	
	# Update connections to make next level nodes selectable
	update_map_connections()

func start_new_run():
	# Reset run data
	current_run_data = {
		"towers": [],
		"npcs": [],
		"gold": 200,
		"completed_worlds": [],
		"available_worlds": []
	}
	
	current_level = 0
	
	# Generate new map
	generate_map()
	
	# Update display
	update_run_info()

func advance_to_next_map():
	# Move to the next set of levels
	current_level += levels_per_map
	
	# Generate new map
	generate_map()
