extends Node2D

signal pressed

# Node configuration
var node_radius = 50
var world_data = {}
var node_color = Color(0.2, 0.6, 0.8)
var completed_color = Color(0.2, 0.8, 0.3)
var selectable_color = Color(1.0, 0.8, 0.2)
var locked_color = Color(0.5, 0.5, 0.5)

# Type-specific icons
var type_icons = {
	"defense": preload("res://assets/defense_icon.png"),
	"rescue": preload("res://assets/rescue_icon.png"),
	"scavenge": preload("res://assets/scavenge_icon.png"),
	"elite": preload("res://assets/elite_icon.png"),
	"boss": preload("res://assets/boss_icon.png")
}

# Array zum Speichern der Verbindungsdaten
var connections = []

func _ready():
	print("World map node initialized: ", world_data.get("name", "unnamed"))
	
	# Connect the button signal with error checking
	var button = $Button
	if button:
		if button.is_connected("pressed", _on_button_pressed):
			print("Button already connected")
		else:
			button.pressed.connect(_on_button_pressed)
			print("Connected button signal for: ", world_data.get("name", "unnamed"))
	else:
		print("ERROR: Button not found in world_map_node")
	
	# Update appearance based on initial data
	update_appearance()

func setup(data):
	world_data = data
	
	# Set node label
	$Label.text = data.get("name", "World")
	
	# Try to set the icon based on type
	var type = data.get("type", "")
	if type in type_icons:
		$Button/TypeIcon.texture = type_icons[type]
	
	# Update appearance
	update_appearance()

func update_appearance():
	# Update node appearance based on state
	if world_data.get("completed", false):
		$Button.modulate = completed_color
		$CompletedIndicator.visible = true
	elif world_data.get("selectable", true):
		$Button.modulate = selectable_color
		$CompletedIndicator.visible = false
	else:
		$Button.modulate = locked_color
		$CompletedIndicator.visible = false
	
	# Special styling for different world types
	match world_data.get("type", ""):
		"boss":
			$Button.custom_minimum_size = Vector2(120, 120)
			$Button.position = Vector2(-60, -60)
			node_radius = 60
		"elite":
			$Button.custom_minimum_size = Vector2(110, 110)
			$Button.position = Vector2(-55, -55)
			node_radius = 55
		_:
			$Button.custom_minimum_size = Vector2(100, 100)
			$Button.position = Vector2(-50, -50)
			node_radius = 50
	
	# Update difficulty indicator
	var difficulty = world_data.get("difficulty", 0)
	if difficulty == 2:  # Hard
		$Button.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2))
	elif difficulty == 1:  # Medium
		$Button.add_theme_color_override("font_color", Color(0.9, 0.7, 0.2))
	else:  # Easy
		$Button.add_theme_color_override("font_color", Color(0.2, 0.7, 0.2))

func _on_button_pressed():
	print("Button pressed on world: ", world_data.get("name", "unnamed"))
	emit_signal("pressed")

func _draw():
	# Alle gespeicherten Verbindungen zeichnen
	for connection in connections:
		var other_node = connection.other_node
		var completed = connection.completed
		
		# Richtungsvektor zwischen Nodes berechnen
		var direction = (other_node.position - position).normalized()
		
		# Start- und Endpunkte berechnen
		var start_position = position + direction * node_radius
		var end_position = other_node.position - direction * other_node.node_radius
		
		# Linie zeichnen
		var connection_color = completed_color if completed else Color(1, 1, 1, 0.5)
		var connection_width = 4 if completed else 2
		
		draw_line(start_position, end_position, connection_color, connection_width)

func draw_connection_to(other_node, completed=false):
	# Verbindungsdaten speichern statt direkt zu zeichnen
	connections.append({
		"other_node": other_node,
		"completed": completed
	})
	# Neu zeichnen anfordern
	queue_redraw()

func clear_connections():
	connections.clear()
	queue_redraw()
