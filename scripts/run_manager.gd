extends Node

# Signals
signal run_updated
signal world_completed(world_data)

# Current run state
var current_run = {
    "towers": [],  # Will contain tower type and level data
    "npcs": [],    # Will contain NPC type and level data
    "gold": 200,
    "current_world": null,
    "completed_worlds": [],
    "available_worlds": []
}

# Persistent unlocks
var unlocked_tower_types = ["basic"]
var unlocked_npc_types = ["fighter"]
var meta_progression = {
    "total_runs": 0,
    "successful_runs": 0,
    "total_worlds_completed": 0,
    "gold_earned": 0
}

func _ready():
    # Make this a singleton that persists between scenes
    set_process(false)  # No need for process

func start_new_run():
    # Reset run data
    current_run = {
        "towers": [],
        "npcs": [],
        "gold": 200,
        "current_world": null,
        "completed_worlds": [],
        "available_worlds": []
    }
    
    # Add starting resources
    add_starting_resources()
    
    meta_progression.total_runs += 1
    
    emit_signal("run_updated")
    
    return current_run

func add_starting_resources():
    # Add a basic tower
    current_run.towers.append({
        "type": "basic",
        "level": 1,
        "health": 50,
        "damage": 2,
        "fire_rate": 1.0
    })
    
    # Add a basic NPC
    current_run.npcs.append({
        "type": "fighter",
        "level": 1,
        "health": 20,
        "damage": 1
    })

func enter_world(world_data):
    current_run.current_world = world_data
    
    # Save run state before entering the world
    save_current_run()
    
    return current_run.current_world

func complete_current_world(rewards=null):
    if current_run.current_world == null:
        return
    
    # Add world to completed list
    var world_id = current_run.current_world.id
    current_run.completed_worlds.append(world_id)
    
    # Apply rewards
    if rewards != null:
        apply_rewards(rewards)
    else:
        # Use default rewards from world data
        apply_rewards(current_run.current_world.rewards)
    
    # Update meta progression
    meta_progression.total_worlds_completed += 1
    
    # Signal completion
    emit_signal("world_completed", current_run.current_world)
    
    # Clear current world
    var completed_world = current_run.current_world
    current_run.current_world = null
    
    # Save updated run
    save_current_run()
    
    return completed_world

func fail_current_world():
    # End the run
    if current_run.current_world != null:
        current_run.current_world = null
        
        # Clear the run (game over)
        current_run = {
            "towers": [],
            "npcs": [],
            "gold": 0,
            "current_world": null,
            "completed_worlds": [],
            "available_worlds": []
        }
        
        # Save (which will clear the save in this case)
        save_current_run()
        
        return true
    
    return false

func apply_rewards(rewards):
    # Add gold
    current_run.gold += rewards.gold
    meta_progression.gold_earned += rewards.gold
    
    # Add towers (simplified - would be more detailed in full implementation)
    for i in range(rewards.towers):
        current_run.towers.append({
            "type": "basic",
            "level": 1,
            "health": 50,
            "damage": 2,
            "fire_rate": 1.0
        })
    
    # Add NPCs (simplified)
    for i in range(rewards.npcs):
        current_run.npcs.append({
            "type": "fighter",
            "level": 1,
            "health": 20,
            "damage": 1
        })
    
    # Signal that run data has been updated
    emit_signal("run_updated")

func save_current_run():
    # This would save to disk in a full implementation
    print("Saving run state...")
    # var save_data = JSON.print(current_run)
    # var file = FileAccess.open("user://current_run.save", FileAccess.WRITE)
    # file.store_string(save_data)
    # file.close()

func load_saved_run():
    # This would load from disk in a full implementation
    print("Loading run state...")
    # if FileAccess.file_exists("user://current_run.save"):
    #    var file = FileAccess.open("user://current_run.save", FileAccess.READ)
    #    var data = file.get_as_text()
    #    file.close()
    #    current_run = JSON.parse(data).result
    #    return true
    # return false
    
    # For now, just start a new run
    start_new_run()
    return true

func complete_run():
    # Called when the final boss is defeated
    meta_progression.successful_runs += 1
    
    # Reset run and save meta progression
    current_run = {
        "towers": [],
        "npcs": [],
        "gold": 0,
        "current_world": null,
        "completed_worlds": [],
        "available_worlds": []
    }
    
    save_current_run()
    save_meta_progression()
    
    return meta_progression

func save_meta_progression():
    # This would save to disk in a full implementation
    print("Saving meta progression...")
    # var save_data = JSON.print(meta_progression)
    # var file = FileAccess.open("user://meta_progression.save", FileAccess.WRITE)
    # file.store_string(save_data)
    # file.close()

func load_meta_progression():
    # This would load from disk in a full implementation
    print("Loading meta progression...")
    # if FileAccess.file_exists("user://meta_progression.save"):
    #    var file = FileAccess.open("user://meta_progression.save", FileAccess.READ)
    #    var data = file.get_as_text()
    #    file.close()
    #    meta_progression = JSON.parse(data).result
    #    return true
    # return false
    
    return false

func get_run_info():
    return {
        "tower_count": current_run.towers.size(),
        "npc_count": current_run.npcs.size(),
        "gold": current_run.gold,
        "worlds_completed": current_run.completed_worlds.size()
    }