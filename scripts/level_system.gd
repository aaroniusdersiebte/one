extends Node

signal level_up(level)
signal xp_gained(current_xp, max_xp)

# Erfahrung und Level-Variablen
var current_level = 1
var current_xp = 0
var xp_to_next_level = 100  # Basis-XP für erstes Level
var level_xp_multiplier = 1.5  # Jedes Level erfordert mehr XP

# Upgrade-Tracking
var upgrades = {
	"damage": 0,
	"fire_rate": 0,
	"bullet_size": 0,
	"bullet_speed": 0,
	"bullet_lifetime": 0,
	"multi_shot": 0,
	"spread_shot": 0,
	"piercing": 0,
	"bouncing": 0,
	"homing": 0,
	"explosive": 0,
	"slow": 0,
	"poison": 0,
	"knockback": 0
}

# Maximale Upgrade-Stufen
var max_upgrade_levels = {
	"damage": 5,
	"fire_rate": 5,
	"bullet_size": 3,
	"bullet_speed": 3,
	"bullet_lifetime": 3,
	"multi_shot": 3,
	"spread_shot": 3,
	"piercing": 3,
	"bouncing": 1,
	"homing": 1,
	"explosive": 1,
	"slow": 3,
	"poison": 3,
	"knockback": 3
}

# Upgrade-Anforderungen - einige Upgrades benötigen Voraussetzungen
var upgrade_requirements = {
	"multi_shot": {"level": 3},
	"spread_shot": {"level": 3},
	"piercing": {"level": 5, "damage": 2},
	"bouncing": {"level": 7, "bullet_speed": 2},
	"homing": {"level": 10, "bullet_speed": 1},
	"explosive": {"level": 12, "damage": 3},
	"slow": {"level": 6},
	"poison": {"level": 8, "damage": 2},
	"knockback": {"level": 5, "bullet_size": 1}
}

# Beschreibung jedes Upgrades
var upgrade_descriptions = {
	"damage": "Erhöht Projektilschaden um 1",
	"fire_rate": "Verringert Zeit zwischen Schüssen um 10%",
	"bullet_size": "Erhöht Projektilgröße um 20%",
	"bullet_speed": "Erhöht Projektilgeschwindigkeit um 15%",
	"bullet_lifetime": "Erhöht Projektillebensdauer um 20%",
	"multi_shot": "Schießt ein zusätzliches Projektil pro Schuss",
	"spread_shot": "Feuert Projektile in einem Streumuster",
	"piercing": "Projektile durchdringen Gegner",
	"bouncing": "Projektile prallen von Wänden ab",
	"homing": "Projektile verfolgen leicht Gegner",
	"explosive": "Projektile explodieren bei Aufprall",
	"slow": "Projektile verlangsamen Gegner kurzzeitig",
	"poison": "Projektile vergiften Gegner und verursachen Schaden über Zeit",
	"knockback": "Projektile stoßen Gegner zurück"
}

func _ready():
	add_to_group("level_system")
	print("Level-System initialisiert")

# Erfahrungspunkte hinzufügen
func add_xp(amount):
	current_xp += amount
	
	# Auf Level-Up prüfen
	if current_xp >= xp_to_next_level:
		perform_level_up()
	
	# Signal für UI-Update senden
	emit_signal("xp_gained", current_xp, xp_to_next_level)

# Level-Up-Funktion - umbenannt, um Konflikt mit Signal zu vermeiden
func perform_level_up():
	current_level += 1
	current_xp -= xp_to_next_level
	xp_to_next_level = int(xp_to_next_level * level_xp_multiplier)
	
	# Level-Up-Signal senden
	emit_signal("level_up", current_level)
	
	# Prüfen, ob noch überschüssige XP für ein weiteres Level-Up vorhanden ist
	if current_xp >= xp_to_next_level:
		perform_level_up()
	else:
		emit_signal("xp_gained", current_xp, xp_to_next_level)

# Prüfen, ob ein Upgrade basierend auf Anforderungen verfügbar ist
func is_upgrade_available(upgrade_name):
	# Prüfen, ob das Upgrade bereits auf maximaler Stufe ist
	if upgrades[upgrade_name] >= max_upgrade_levels[upgrade_name]:
		return false
	
	# Wenn es Anforderungen gibt, prüfe diese
	if upgrade_name in upgrade_requirements:
		var reqs = upgrade_requirements[upgrade_name]
		
		# Level-Anforderung prüfen
		if "level" in reqs and current_level < reqs["level"]:
			return false
		
		# Andere Upgrade-Voraussetzungen prüfen
		for req_upgrade in reqs:
			if req_upgrade != "level" and upgrades[req_upgrade] < reqs[req_upgrade]:
				return false
	
	return true

# Verfügbare Upgrades zur Auswahl holen
func get_available_upgrades(count=3):
	var available = []
	
	# Liste aller verfügbaren Upgrades erstellen
	for upgrade in upgrades.keys():
		if is_upgrade_available(upgrade):
			available.append(upgrade)
	
	# Liste mischen
	available.shuffle()
	
	# Angeforderte Anzahl an Upgrades zurückgeben (oder weniger, wenn nicht genug verfügbar)
	return available.slice(0, min(count, available.size()))

# Upgrade anwenden
func apply_upgrade(upgrade_name):
	if is_upgrade_available(upgrade_name):
		upgrades[upgrade_name] += 1
		return true
	return false

# Aktuellen Wert für ein bestimmtes Upgrade-Attribut abrufen
func get_upgrade_value(upgrade_name):
	return upgrades[upgrade_name]

# Upgrade-Beschreibung abrufen
func get_upgrade_description(upgrade_name):
	return upgrade_descriptions[upgrade_name]
