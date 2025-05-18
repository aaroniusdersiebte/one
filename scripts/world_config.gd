extends Node

signal start_world(config)
signal back_pressed

# Current world configuration
var world_config = {}
var difficulty_level = 0  # 0=Easy, 1=Medium, 2=Hard

# Enemy types available for different world types
var enemy_types = {
    "defense": ["standard", "fast"],
    "rescue": ["standard", "trap"],
    "scavenge": ["heavy", "resource_carrier"],
    "elite": ["elite", "fast", "heavy"],
    "boss": ["boss", "minion"]
}

func _ready():
    # Connect UI signals
    $UI/Panel/StartButton.pressed.connect(_on_start_button_pressed)
    $UI/Panel/BackButton.pressed.connect(_on_back_button_pressed)
    $UI/Panel/DifficultySlider.value_changed.connect(_on_difficulty_changed)
    
    # Hide the UI until configured
    $UI.visible = false

func configure_world(world_data):
    # Store the world configuration
    world_config = world_data.duplicate(true)
    
    # Update UI
    $UI/Panel/Title.text = "World: " + world_config.name
    $UI/Panel/Description.text = get_world_description(world_config.type)
    
    # Set waves info
    var wave_count = world_config.waves
    $UI/Panel/WaveInfo.text = "Wave Count: " + str(wave_count)
    
    # Set enemy types
    var enemy_text = "Enemy Types: "
    if world_config.type in enemy_types:
        enemy_text += ", ".join(enemy_types[world_config.type])
    else:
        enemy_text += "Standard"
    $UI/Panel/EnemyInfo.text = enemy_text
    
    # Set special condition if any
    if world_config.special != null:
        $UI/Panel/SpecialInfo.text = "Special: " + world_config.special.name
        $UI/Panel/SpecialInfo.visible = true
    else:
        $UI/Panel/SpecialInfo.visible = false
    
    # Set rewards info
    var rewards_text = "Rewards: "
    if world_config.rewards.gold > 0:
        rewards_text += str(world_config.rewards.gold) + " Gold"
    
    if world_config.rewards.towers > 0:
        if world_config.rewards.gold > 0:
            rewards_text += ", "
        rewards_text += str(world_config.rewards.towers) + " Tower"
        if world_config.rewards.towers > 1:
            rewards_text += "s"
    
    if world_config.rewards.npcs > 0:
        if world_config.rewards.gold > 0 or world_config.rewards.towers > 0:
            rewards_text += ", "
        rewards_text += str(world_config.rewards.npcs) + " NPC"
        if world_config.rewards.npcs > 1:
            rewards_text += "s"
    
    $UI/Panel/RewardsInfo.text = rewards_text
    
    # Set initial difficulty
    difficulty_level = world_config.difficulty
    $UI/Panel/DifficultySlider.value = difficulty_level
    
    # Show the UI
    $UI.visible = true

func get_world_description(world_type):
    # Return description based on world type
    match world_type:
        "defense":
            return "Defend your base against waves of enemies. Standard tower defense gameplay."
        "rescue":
            return "Rescue NPCs or repair towers while defending against enemy waves."
        "scavenge":
            return "Focus on collecting resources. Fewer enemies but they're tougher."
        "elite":
            return "Face stronger enemies for better rewards. High risk, high reward."
        "boss":
            return "A single difficult wave with a powerful boss enemy. Be prepared!"
        _:
            return "Unknown world type."

func _on_difficulty_changed(value):
    # Update difficulty level
    difficulty_level = int(value)
    
    # Update world config
    world_config.difficulty = difficulty_level
    
    # Update rewards based on difficulty
    match world_config.type:
        "defense":
            world_config.rewards.gold = [100, 150, 200][difficulty_level]
            world_config.rewards.towers = [0, 1, 1][difficulty_level]
            world_config.rewards.npcs = [1, 1, 2][difficulty_level]
        "rescue":
            world_config.rewards.gold = [50, 100, 150][difficulty_level]
            world_config.rewards.towers = [1, 1, 2][difficulty_level]
            world_config.rewards.npcs = [2, 3, 4][difficulty_level]
        "scavenge":
            world_config.rewards.gold = [200, 300, 400][difficulty_level]
            world_config.rewards.towers = [0, 1, 1][difficulty_level]
            world_config.rewards.npcs = [0, 1, 1][difficulty_level]
        "elite":
            world_config.rewards.gold = [200, 300, 400][difficulty_level]
            world_config.rewards.towers = [1, 2, 2][difficulty_level]
            world_config.rewards.npcs = [2, 2, 3][difficulty_level]
        "boss":
            world_config.rewards.gold = [300, 400, 500][difficulty_level]
            world_config.rewards.towers = [1, 2, 3][difficulty_level]
            world_config.rewards.npcs = [2, 3, 4][difficulty_level]
    
    # Update wave count
    world_config.waves = get_wave_count(world_config.type, difficulty_level)
    
    # Update UI
    configure_world(world_config)

func get_wave_count(world_type, difficulty):
    # Return wave count based on world type and difficulty
    match world_type:
        "defense":
            return [3, 5, 7][difficulty]
        "rescue":
            return [3, 4, 6][difficulty]
        "scavenge":
            return [2, 3, 4][difficulty]
        "elite":
            return [4, 6, 8][difficulty]
        "boss":
            return 1  # Boss worlds always have 1 wave
        _:
            return 5  # Default

func _on_start_button_pressed():
    emit_signal("start_world", world_config)

func _on_back_button_pressed():
    emit_signal("back_pressed")