extends Control

# Signale
signal start_game
signal continue_game
signal quit_game

func _ready():
	# Verbinde Button-Signale
	$ButtonsContainer/StartButton.pressed.connect(_on_start_button_pressed)
	$ButtonsContainer/ContinueButton.pressed.connect(_on_continue_button_pressed)
	$ButtonsContainer/OptionsButton.pressed.connect(_on_options_button_pressed)
	$ButtonsContainer/QuitButton.pressed.connect(_on_quit_button_pressed)
	
	# Überprüfen, ob ein gespeichertes Spiel vorhanden ist
	check_for_saved_game()

func check_for_saved_game():
	# Dies würde prüfen, ob ein gespeichertes Spiel existiert
	# Vorerst deaktivieren wir einfach den Fortsetzen-Button
	$ButtonsContainer/ContinueButton.disabled = true

func _on_start_button_pressed():
	emit_signal("start_game")

func _on_continue_button_pressed():
	emit_signal("continue_game")

func _on_options_button_pressed():
	# Optionsmenü kann später implementiert werden
	print("Optionsmenü noch nicht implementiert")

func _on_quit_button_pressed():
	# Spiel beenden
	get_tree().quit()
