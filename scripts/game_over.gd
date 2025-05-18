extends Control

signal new_run
signal main_menu

var run_manager

func _ready():
    # Connect button signals
    $ButtonsContainer/NewRunButton.pressed.connect(_on_new_run_button_pressed)
    $ButtonsContainer/MainMenuButton.pressed.connect(_on_main_menu_button_pressed)
    
    # Get the run manager
    run_manager = get_node("/root/GameManager").run_manager
    
    # Update stats display
    update_stats()

func update_stats():
    # Get stats from the run manager
    var worlds_completed = run_manager.meta_progression.total_worlds_completed
    var gold_earned = run_manager.meta_progression.gold_earned
    
    # Update the stats label
    $StatsLabel.text = "Worlds Completed: " + str(worlds_completed) + "     Total Gold Earned: " + str(gold_earned)

func _on_new_run_button_pressed():
    emit_signal("new_run")
    
    # Tell the game manager to start a new run
    get_node("/root/GameManager").load_scene("res://scenes/world_map.tscn")

func _on_main_menu_button_pressed():
    emit_signal("main_menu")
    
    # Tell the game manager to go to the main menu
    get_node("/root/GameManager").load_scene("res://scenes/main_menu.tscn")