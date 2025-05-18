extends Node

# Scene paths
const MAIN_MENU_SCENE = "res://scenes/main_menu.tscn"
const WORLD_MAP_SCENE = "res://scenes/world_map.tscn"
const WORLD_CONFIG_SCENE = "res://scenes/world_config.tscn"
const GAME_SCENE = "res://scenes/World.tscn"  # Your existing game world
const GAME_OVER_SCENE = "res://scenes/game_over.tscn"
const RUN_COMPLETE_SCENE = "res://scenes/run_complete.tscn"

# State
var current_scene_instance = null
var run_manager = null
var is_transitioning = false

func _ready():
	print("Game Manager initializing...")
	
	# Create run manager singleton
	run_manager = load("res://scripts/run_manager.gd").new()
	add_child(run_manager)
	print("Run manager created")
	
	# Load the main menu or continue from a saved run
	if run_manager.load_saved_run():
		print("Saved run loaded, starting world map")
		load_scene(WORLD_MAP_SCENE)
	else:
		print("No saved run found, starting main menu")
		load_scene(MAIN_MENU_SCENE)

func load_scene(scene_path, fade_time=0.5):
	if is_transitioning:
		return
		
	is_transitioning = true
	
	# Start fade out
	var transition_rect = $TransitionLayer/ColorRect
	var fade_out = create_tween()
	fade_out.tween_property(transition_rect, "color", Color(0, 0, 0, 1), fade_time)
	
	# Show loading label
	$TransitionLayer/LoadingLabel.visible = true
	
	# Wait for fade out to complete
	await fade_out.finished
	
	# Remove current scene
	if current_scene_instance != null:
		$SceneContainer.remove_child(current_scene_instance)
		current_scene_instance.queue_free()
	
	# Load new scene
	var new_scene = load(scene_path).instantiate()
	$SceneContainer.add_child(new_scene)
	current_scene_instance = new_scene
	
	# Connect scene-specific signals
	connect_scene_signals()
	
	# Hide loading label
	$TransitionLayer/LoadingLabel.visible = false
	
	# Start fade in
	var fade_in = create_tween()
	fade_in.tween_property(transition_rect, "color", Color(0, 0, 0, 0), fade_time)
	
	# Wait for fade in to complete
	await fade_in.finished
	
	is_transitioning = false

func connect_scene_signals():
	# Connect signals based on the current scene with improved debugging
	print("Connecting signals for scene: ", current_scene_instance.name)
	
	var scene_path = ""
	if current_scene_instance.get_script():
		var script_path = current_scene_instance.get_script().resource_path
		print("Script path: ", script_path)
		scene_path = script_path.get_file().get_basename()
		print("Scene script basename: ", scene_path)
	else:
		print("WARNING: Current scene has no script")
	
	# Match auf den Skriptnamen statt auf den Dateipfad
	match scene_path:
		"main_menu":
			print("Connecting main_menu signals")
			if current_scene_instance.has_signal("start_game"):
				if current_scene_instance.is_connected("start_game", _on_main_menu_start_game):
					print("Signal 'start_game' already connected")
				else:
					current_scene_instance.start_game.connect(_on_main_menu_start_game)
					print("Connected 'start_game' signal")
			else:
				print("ERROR: main_menu has no 'start_game' signal")
		
		"world_map":
			print("Connecting world_map signals")
			if current_scene_instance.has_signal("world_selected"):
				if current_scene_instance.is_connected("world_selected", _on_world_map_world_selected):
					print("Signal 'world_selected' already connected")
				else:
					current_scene_instance.world_selected.connect(_on_world_map_world_selected)
					print("Connected 'world_selected' signal")
			else:
				print("ERROR: world_map has no 'world_selected' signal")
				
			if current_scene_instance.has_signal("back_pressed"):
				if current_scene_instance.is_connected("back_pressed", _on_world_map_back_pressed):
					print("Signal 'back_pressed' already connected")
				else:
					current_scene_instance.back_pressed.connect(_on_world_map_back_pressed)
					print("Connected 'back_pressed' signal")
			else:
				print("ERROR: world_map has no 'back_pressed' signal")
		
		"world_config":
			print("Connecting world_config signals")
			if current_scene_instance.has_signal("start_world"):
				if current_scene_instance.is_connected("start_world", _on_world_config_start_world):
					print("Signal 'start_world' already connected")
				else:
					current_scene_instance.start_world.connect(_on_world_config_start_world)
					print("Connected 'start_world' signal")
			else:
				print("ERROR: world_config has no 'start_world' signal")
				
			if current_scene_instance.has_signal("back_pressed"):
				if current_scene_instance.is_connected("back_pressed", _on_world_config_back_pressed):
					print("Signal 'back_pressed' already connected")
				else:
					current_scene_instance.back_pressed.connect(_on_world_config_back_pressed)
					print("Connected 'back_pressed' signal")
			else:
				print("ERROR: world_config has no 'back_pressed' signal")
		
		"game", "World":
			print("Connecting game world signals")
			# You'll need to add signals to your game scene to handle completion/failure
			if current_scene_instance.has_signal("world_completed"):
				if current_scene_instance.is_connected("world_completed", _on_game_world_completed):
					print("Signal 'world_completed' already connected")
				else:
					current_scene_instance.world_completed.connect(_on_game_world_completed)
					print("Connected 'world_completed' signal")
			else:
				print("ERROR: game scene has no 'world_completed' signal")
				
			if current_scene_instance.has_signal("world_failed"):
				if current_scene_instance.is_connected("world_failed", _on_game_world_failed):
					print("Signal 'world_failed' already connected")
				else:
					current_scene_instance.world_failed.connect(_on_game_world_failed)
					print("Connected 'world_failed' signal")
			else:
				print("ERROR: game scene has no 'world_failed' signal")
			
			# Set up the game world with the current world config
			if run_manager.current_run.current_world != null:
				# Configure the game scene (you'll need to implement this in your game scene)
				if current_scene_instance.has_method("configure_world"):
					current_scene_instance.configure_world(run_manager.current_run.current_world)
					print("Configured game world with data")
				else:
					print("ERROR: game scene has no 'configure_world' method")
		_:
			print("WARNING: Unknown scene type: ", scene_path)

# Signal handlers
func _on_main_menu_start_game():
	# Start a new run and go to the world map
	run_manager.start_new_run()
	load_scene(WORLD_MAP_SCENE)

func _on_world_map_world_selected(world_data):
	# Go to the world configuration screen
	load_scene(WORLD_CONFIG_SCENE)
	
	# Configure the world
	if current_scene_instance.has_method("configure_world"):
		current_scene_instance.configure_world(world_data)

func _on_world_map_back_pressed():
	# Return to main menu
	load_scene(MAIN_MENU_SCENE)

func _on_world_config_start_world(world_config):
	# Save the selected world in the run manager
	run_manager.enter_world(world_config)
	
	# Load the game scene
	load_scene(GAME_SCENE)

func _on_world_config_back_pressed():
	# Return to world map
	load_scene(WORLD_MAP_SCENE)

func _on_game_world_completed(rewards=null):
	# Mark the current world as completed
	var completed_world = run_manager.complete_current_world(rewards)
	
	# Check if this was the final boss world
	var was_final_boss = completed_world != null && completed_world.type == "boss" && completed_world.level == 3
	
	if was_final_boss:
		# Run completed! Show completion screen
		run_manager.complete_run()
		load_scene(RUN_COMPLETE_SCENE)
	else:
		# Return to world map
		load_scene(WORLD_MAP_SCENE)
		
		# Update the world map with the completed world
		if current_scene_instance.has_method("mark_world_completed"):
			current_scene_instance.mark_world_completed(completed_world.id)

func _on_game_world_failed():
	# Handle game over
	run_manager.fail_current_world()
	load_scene(GAME_OVER_SCENE)
