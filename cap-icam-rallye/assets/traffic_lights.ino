/**
 * PROGRAMME FEU DE CIRCULATION SIMPLIFIÉ (IF/ELSE IF)
 * Une voie est TOUJOURS au rouge quand l'autre est active.
 */

// --- Définitions des Broches ---
#define RW 25 
#define OW 26 
#define VW 27
#define RN 28 
#define ON 14 
#define VN 15
#define RE 29 
#define OE 11 
#define VE 12
#define RS 30 
#define OS 32 
#define VS 9

#define IL1 17 // Capteur Nord
#define IL2 16 // Capteur Sud
#define IL3 19 // Capteur Est
#define IL4 18 // Capteur Ouest

// Temps de transition (ms)
const int T_ORANGE = 2000;
const int T_SECURITE = 1000;
const int T_VERT = 5000;

void setup() {
  pinMode(RW, OUTPUT); pinMode(OW, OUTPUT); pinMode(VW, OUTPUT);
  pinMode(RN, OUTPUT); pinMode(ON, OUTPUT); pinMode(VN, OUTPUT);
  pinMode(RE, OUTPUT); pinMode(OE, OUTPUT); pinMode(VE, OUTPUT);
  pinMode(RS, OUTPUT); pinMode(OS, OUTPUT); pinMode(VS, OUTPUT);
  
  pinMode(IL1, INPUT_PULLUP); pinMode(IL2, INPUT_PULLUP);
  pinMode(IL3, INPUT_PULLUP); pinMode(IL4, INPUT_PULLUP);
}

void loop() {
  // CAS 1 : Aucun véhicule détecté à l'Est ou à l'Ouest -> Axe Nord-Sud au Vert
  if (digitalRead(IL3) == HIGH && digitalRead(IL4) == HIGH) {
    // Vert Nord-Sud
    digitalWrite(VN, HIGH); digitalWrite(VS, HIGH);
    digitalWrite(ON, LOW);  digitalWrite(OS, LOW);
    digitalWrite(RN, LOW);  digitalWrite(RS, LOW);

    // Est-Ouest FORCÉ au Rouge
    digitalWrite(VE, LOW);  digitalWrite(VW, LOW);
    digitalWrite(OE, LOW);  digitalWrite(OW, LOW);
    digitalWrite(RE, HIGH); digitalWrite(RW, HIGH);
  } 
  
  // CAS 2 : Véhicule détecté à l'Est ou à l'Ouest -> On change de phase
  else if (digitalRead(IL3) == LOW || digitalRead(IL4) == LOW) {
    // 1. Transition Nord-Sud vers Rouge
    // Orange NS
    digitalWrite(VN, LOW);  digitalWrite(VS, LOW);
    digitalWrite(ON, HIGH); digitalWrite(OS, HIGH);
    digitalWrite(RN, LOW);  digitalWrite(RS, LOW);
    delay(T_ORANGE);

    // Rouge NS
    digitalWrite(VN, LOW);  digitalWrite(VS, LOW);
    digitalWrite(ON, LOW);  digitalWrite(OS, LOW);
    digitalWrite(RN, HIGH); digitalWrite(RS, HIGH);
    delay(T_SECURITE);         // Tout le monde au rouge pour la sécurité
    
    // 2. Passage au Vert Est-Ouest
    // Vert EW
    digitalWrite(VE, HIGH); digitalWrite(VW, HIGH);
    digitalWrite(OE, LOW);  digitalWrite(OW, LOW);
    digitalWrite(RE, LOW);  digitalWrite(RW, LOW);

    // Nord-Sud RESTE au rouge
    digitalWrite(VN, LOW);  digitalWrite(VS, LOW);
    digitalWrite(ON, LOW);  digitalWrite(OS, LOW);
    digitalWrite(RN, HIGH); digitalWrite(RS, HIGH);
    delay(T_VERT);             // Temps de passage
    
    // 3. Retour vers Rouge Est-Ouest
    // Orange EW
    digitalWrite(VE, LOW);  digitalWrite(VW, LOW);
    digitalWrite(OE, HIGH); digitalWrite(OW, HIGH);
    digitalWrite(RE, LOW);  digitalWrite(RW, LOW);
    delay(T_ORANGE);

    // Rouge EW
    digitalWrite(VE, LOW);  digitalWrite(VW, LOW);
    digitalWrite(OE, LOW);  digitalWrite(OW, LOW);
    digitalWrite(RE, HIGH); digitalWrite(RW, HIGH);
    delay(T_SECURITE);
  }
}
