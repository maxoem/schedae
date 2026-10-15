### **Karte 1.1: Universelle Lerndefinition nach Mitchell (Typ I: Strukturelle Definition)**
* **Vorderseite:** Wie lautet die formale Lerndefinition nach Tom Mitchell (1997) und wie grenzt sie maschinelles Lernen von klassischer Programmierung ab?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Ein Computerprogramm lernt aus Erfahrung \\(E\\) bezüglich einer Klasse von Aufgaben \\(T\\) und dem Leistungsmaß \\(P\\), wenn seine Leistung bei Aufgaben in \\(T\\) (gemessen durch \\(P\\)) durch die Erfahrung \\(E\\) zunimmt.
  * **[Semantischer Kern]:** Maschinelles Lernen ersetzt die manuelle Implementierung stabiler Algorithmen (\\(T\\)) durch eine optimierbare Funktionsfamilie. Das System passt seine inneren Zustände eigenständig an, um bei wachsender Datenmenge (\\(E\\)) bezüglich einer Zielmetrik (\\(P\\)) besser zu werden.
  * **[Transfer-Indikator]:** Anwendbar in Prüfungsfragen zur Abgrenzung von Heuristiken/Sonderregeln gegenüber ML. Identifiziere in Aufgabenstellungen stets explizit das Tripel \\((T, P, E)\\).
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 1 & 2)
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.1 (*Learning Algorithms*), S. 98–99

---

### **Karte 1.2: Taxonomie & Venn-Diagramm der KI-Disziplinen (Typ II: Dichotomien & Klassifikationen)**
* **Vorderseite:** Wie bilden KI, Machine Learning, Representation Learning und Deep Learning eine hierarchische Mengenarchitektur?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** 
    \\[\text{KI} \supset \text{Machine Learning (ML)} \supset \text{Representation Learning} \supset \text{Deep Learning (DL)}\\]
  * **[Semantischer Kern]:** 
    * *KI:* Gesamtheit aller Systeme mit intelligentem Verhalten (inkl. Regelsystemen/GOFAI).
    * *ML:* Abbildung aus Daten lernen (benötigt oft noch manuelles Feature-Engineering).
    * *Representation Learning:* Automatisches Erlernen der Merkmalsdarstellung aus Rohdaten.
    * *DL:* Repräsentationslernen mittels geschachtelter, tiefes hierarchischer Funktionskompositionen (\\(f^{(L)} \circ \dots \circ f^{(1)}\\)).
  * **[Transfer-Indikator]:** Nutzen zur Einordnung von Algorithmen. Wenn manuell extrahierte Merkmale (z.B. Sobel-Filter) an einen Klassifikator übergeben werden \\(\to\\) *Klassisches ML*. Wenn Rohdaten (Pixel) direkt verarbeitet werden \\(\to\\) *Deep Learning*.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 1 & 2)
  * Goodfellow et al.: *Deep Learning*, Kapitel 1 (*Introduction*), S. 8 (Abbildung 1.4)
  * Prince: *Understanding Deep Learning*, Kapitel 1 (*Introduction*), S. 1–2

---

### **Karte 1.3: Symbolische vs. Subsymbolische KI / Historische Wellen (Typ II: Dichotomien)**
* **Vorderseite:** Worin unterscheidet sich GOFAI von subsymbolischen Ansätzen und durch welche drei Hauptwellen entwickelte sich die neuronale Forschung?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** 
    * *GOFAI (Symbolisch):* Verarbeitet explizite Symbole, Regeln und Logik (\\(A \land B \implies C\\)).
    * *Subsymbolisch (Konnektionismus):* Verarbeitet kontinuierliche Vektoren und verteilte Aktivierungsmuster.
    * *3 Wellen:* 1. *Cybernetics* (1940–60er; Perzeptron), 2. *Connectionism/PDP* (1980–90er; Backpropagation, MLPs), 3. *Deep Learning* (ab 2006; GPUs, Big Data, tiefe Netze).
  * **[Semantischer Kern]:** GOFAI scheitert an der Verarbeitbarkeit unstrukturierter realer Daten (z. B. Bildelementen), da menschliches Wissen nicht vollständig regelbasiert formalisiert werden kann (*Moravecs Paradoxon*). Subsymbolische Netze lernen kontinuierliche Abbildungen direkt aus Datenräumen.
  * **[Transfer-Indikator]:** Hilft bei der Beurteilung von Systemgrenzen: Schachturniere/Schachcomputer (Deep Blue) \\(\to\\) *GOFAI/Suchbäume*; Bildgenerierung/Sprachverständnis \\(\to\\) *Subsymbolisch/Deep Learning*.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 1)
  * Goodfellow et al.: *Deep Learning*, Kapitel 1.2 (*History of Deep Learning*), S. 12–17


---

### **Karte 2.1: ML als Funktionsapproximation vs. „Wissensgenerierung“ (Typ I: Strukturelle Definition)**
* **Vorderseite:** Warum ist der Begriff „Wissensgenerierung“ mathematisch unpräzise und wie wird ML formal korrekt definiert?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** ML ist das statistische Problem der **Funktionsapproximation** \\(y = f(x; \theta)\\) oder der **Dichteschätzung** \\(p(x)\\) bzw. \\(p(y|x)\\) auf Basis einer Stichprobe \\(X_{\text{train}} \sim p_{\text{data}}\\).
  * **[Semantischer Kern]:** ML generiert keine semantischen Einsichten oder abstraktes Handlungswissen, sondern sucht in einer parametrisierten Hypothesenklasse \\(\mathcal{F}\\) nach Parametern \\(\theta\\), die eine gegebene Verlustfunktion über der unbekannten echten Datenverteilung \\(p_{\text{data}}\\) minimieren.
  * **[Transfer-Indikator]:** Wichtig für präzise Argumentationen in Klausuren. Statt „Das Modell versteht X“ schreibst du: „Das Modell approximiert die bedingte Wahrscheinlichkeitsverteilung \\(p(y|x)\\) über den Parametervektor \\(\theta\\)“.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 2)
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.1 & 6.1, S. 98, 166–167
  * Prince: *Understanding Deep Learning*, Kapitel 2.1, S. 17–18

---

### **Karte 2.2: Formalisierung von „Tiefe“ und Repräsentationshierarchie (Typ I: Strukturelle Definition)**
* **Vorderseite:** Wie ist die „Tiefe“ (Depth) eines Modells formal definiert und welcher didaktische Vorteil ergibt sich daraus für komplexe Muster?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Tiefe ist die Länge des längsten Pfades im gerichteten Berechnungsgraphen (*Computational Graph*) oder die Anzahl sequentiell verketteter Transformationen:
    \\[f(x) = f^{(L)}(f^{(L-1)}(\dots f^{(1)}(x; \theta^{(1)})\dots ))\\]
  * **[Semantischer Kern]:** Tiefe Modelle lösen das Repräsentationsproblem durch **Verschachtelung einfacher Konzepte**: Frühe Schichten erfassen lokale, abstrakte Grundprimitiven (z.B. Kanten), spätere Schichten kombinieren diese zu komplexen semantischen Objekten (z.B. Gesichter).
  * **[Transfer-Indikator]:** Erklärung von Netzarchitekturen (z.B. CNNs/MLPs). Bei flachen Modellen wächst die Anzahl benötigter Parameter für manche Funktionen exponentiell; tiefe Netze komprimieren diese Komplexität durch Wiederverwendung von Merkmalen (*Feature Reuse*).
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 2)
  * Goodfellow et al.: *Deep Learning*, Kapitel 1.1 & 6.4.1, S. 5–6, 196–198
  * Prince: *Understanding Deep Learning*, Kapitel 3–4, S. 25, 41–52

---

### **Karte 2.3: Die Mannigfaltigkeitshypothese (Typ III: Argumentations-Muster)**
* **Vorderseite:** Was besagt die Mannigfaltigkeitshypothese (*Manifold Hypothesis*) und warum macht sie Deep Learning in hochdimensionalen Räumen überhaupt möglich?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Reale Daten (z. B. Bilder der Dimension \\(\mathbb{R}^{1024 \times 1024}\\)) verteilen sich nicht gleichmäßig im Raum, sondern konzentrieren sich nahe niederdimensionaler, gekrümmter Unterräume (Mannigfaltigkeiten \\(\mathcal{M} \subset \mathbb{R}^d\\) mit \\(d \ll D\\)).
  * **[Semantischer Kern]:** Der Raum aller möglichen Pixelkombinationen ist überwiegend Rauschen. Relevante Objekte liegen auf glatten Flächen im Raum. Deep Learning lernt Transformationen, die diese gekrümmten Mannigfaltigkeiten entwirren (*disentangle*), sodass sie im Merkmalssraum linear trennbar werden.
  * **[Transfer-Indikator]:** Antwort auf die Frage nach dem *Fluch der Dimensionalität* (*Curse of Dimensionality*). Wenn gefragt wird, warum ML trotz gigantischer Eingaberäume mit endlich vielen Trainingsbeispielen generalisieren kann.
* **Quelle(n):**
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.11.3 (*Manifolds*), S. 160–162
  * Prince: *Understanding Deep Learning*, Kapitel 14.3 (*Manifold Precision/Recall*), S. 273–275

---

### **Karte 3.1: Supervised vs. Unsupervised Learning – Formaler Abgleich (Typ II: Dichotomien)**
* **Vorderseite:** Wie unterscheiden sich Supervised und Unsupervised Learning hinsichtlich ihres mathematischen Zielzustands?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** 
    * *Supervised:* Gegeben Datensatz \\(\mathcal{D} = \{(x^{(i)}, y^{(i)})\}_{i=1}^N\\). Schätze \\(p(y|x)\\) oder fahre Funktionsanpassung \\(f(x) \approx y\\) zur Fehler-Minimierung.
    * *Unsupervised:* Gegeben Datensatz \\(\mathcal{D} = \{x^{(i)}\}_{i=1}^N\\). Schätze die Wahrscheinlichkeitsverteilung \\(p(x)\\) oder latente Zustände \\(p(z|x)\\).
  * **[Semantischer Kern]:** Supervised Learning sucht unter Anleitung eines Zielsignals (*Label*) eine Entscheidungsgrenze oder Regressionskurve. Unsupervised Learning sucht ohne Feedback nach der intrinsischen Geometrie, Dichte oder Gruppenstruktur der Daten.
  * **[Transfer-Indikator]:** Überprüfe die Datenstruktur in der Problemstellung: Steht für jedes \\(x\\) ein expliziter Soll-Wert \\(y\\) bereit? \\(\to\\) *Supervised*. Sollen Muster, Ausreißer oder Cluster in reinen Merkmalen gefunden werden? \\(\to\\) *Unsupervised*.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 3)
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.1.3 & 5.1.4, S. 102–105
  * Prince: *Understanding Deep Learning*, Kapitel 1.1 & 14, S. 1–2, 269–270

---

### **Karte 3.2: Reinforcement Learning & MDP (Typ I: Strukturelle Definition)**
* **Vorderseite:** Wie ist Reinforcement Learning formal als Markov-Entscheidungsprozess (MDP) definiert?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Definiert durch das Tupel \\((S, A, P, R, \gamma)\\): Zustand \\(s \in S\\), Aktion \\(a \in A\\), Übergangswahrscheinlichkeit \\(P(s'|s,a)\\), Belohnungsfunktion \\(R(s,a)\\) und Diskontierungsfaktor \\(\gamma \in [0, 1)\\). Ziel: Erlernen einer Policy \\(\pi(a|s)\\) zur Maximierung des erwarteten kumulativen Rewards:
    \\[\max_\pi \mathbb{E} \left[ \sum_{t=0}^\infty \gamma^t r_t \right]\\]
  * **[Semantischer Kern]:** Der Agent erhält keine korrekten Antworten (*Labels*), sondern agiert aktiv in einer Umwelt. Er muss das Dilemma zwischen Exploration (Neues ausprobieren) und Exploitation (Bekanntes nutzen) auflösen, um zeitlich verzögerte Belohnungen zu optimieren.
  * **[Transfer-Indikator]:** Kennzeichen: Sequentielle Entscheidungen, dynamische Umgebungen, verzögertes Feedback (z.B. Robotersteuerung, Spiel-KI).
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 3)
  * Prince: *Understanding Deep Learning*, Kapitel 19 (*Reinforcement Learning*), S. 373–376
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.1.5, S. 105–106

---

### **Karte 3.3: Self-Supervised Learning & Contrastive Learning (Typ III: Argumentations-Muster)**
* **Vorderseite:** Wie erzeugt Self-Supervised Learning aus ungelabelten Daten Aufsichtssignale und wie funktioniert Contrastive Learning?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Konstruktion einer *Pretext Task* auf ungelabelten Daten \\(x\\). Im *Contrastive Learning* wird ein Verlust (z.B. InfoNCE) minimiert:
    \\[\mathcal{L}_{\text{contrastive}} = -\log \frac{\exp(\text{sim}(z_i, z_j)/\tau)}{\sum_{k} \exp(\text{sim}(z_i, z_k)/\tau)}\\]
  * **[Semantischer Kern]:** Die Daten stellen ihre eigenen Labels bereit (z. B. Masken-Token vorhersagen, Bild-Transformationen zusammenhalten). Kontrastives Lernen zieht Repräsentationen ähnlich augmentierter Datenpunkte (\\(z_i, z_j\\)) im Vektorraum zusammen und stößt unähnliche Punkte (\\(z_k\\)) ab.
  * **[Transfer-Indikator]:** Standardansatz für das Vortraining (*Pretraining*) von Foundation Models (z. B. BERT, GPT, CLIP) bei gigantischen ungelabelten Datenmengen vor dem zielspezifischen *Finetuning*.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 3)
  * Prince: *Understanding Deep Learning*, Kapitel 8.5 & 14, S. 159, 231
  * Goodfellow et al.: *Deep Learning*, Kapitel 15.6, S. 535–539

---

### **Karte 4.1: Klassifikations-Typen & Aktivierungsfunktionen (Typ II: Dichotomien)**
* **Vorderseite:** Welche mathematischen Ausgabefunktionen und Verlustfunktionen charakterisieren Binary, Multi-Class und Multi-Label Classification?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:**
    * *Binary:* 1 Output-Neuron mit Sigmoid \\(\sigma(z) = \frac{1}{1 + e^{-z}}\\), Verlust: *Binary Cross-Entropy (BCE)*.
    * *Multi-Class (Single-Label):* \\(K\\) Output-Neuronen mit Softmax \\(\text{softmax}(z)_k = \frac{e^{z_k}}{\sum_j e^{z_j}}\\), Verlust: *Categorical Cross-Entropy*. Summe aller Klassenwahrscheinlichkeiten ist \\(1\\).
    * *Multi-Label:* \\(K\\) Output-Neuronen mit unabhängigen Sigmoid-Aktivierungen, Verlust: Summe individueller BCEs.
  * **[Semantischer Kern]:** Softmax erzeugt eine echte Wahrscheinlichkeitsverteilung über sich gegenseitig ausschließende Klassen. Unabhängige Sigmoide behandeln jede Klasse als binäre Ja/Nein-Entscheidung (Klassen können gleichzeitig auftreten).
  * **[Transfer-Indikator]:** Aufgabenanalyse: Kann ein Bild *sowohl* Hund *als auch* Katze enthalten? \\(\to\\) Multi-Label (Sigmoid). Ist es *exklusiv* eine Ziffer 0–9? \\(\to\\) Multi-Class (Softmax).
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 4)
  * Prince: *Understanding Deep Learning*, Kapitel 5.2–5.4, S. 64–69
  * Goodfellow et al.: *Deep Learning*, Kapitel 6.2.2, S. 180–184

---

### **Karte 4.2: Diskriminative vs. Generative Modelle (Typ II: Dichotomien)**
* **Vorderseite:** Wie unterscheiden sich diskriminative und generative Modelle in ihrer Wahrscheinlichkeitsmodellierung?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** 
    * *Diskriminativ:* Modelliert direkt die bedingte Wahrscheinlichkeit \\(p(y|x)\\) (oder lernt eine Entscheidungsgrenze \\(f(x) = y\\)).
    * *Generativ:* Modelliert die gemeinsame Verteilung \\(p(x, y)\\) oder die Datenverteilung \\(p(x)\\). Inferenz via Bayes-Theorem:
      \\[p(y|x) = \frac{p(x|y)p(y)}{p(x)}\\]
  * **[Semantischer Kern]:** Diskriminative Modelle lernen lediglich, Klassen voneinander zu trennen (sie kennen die Merkmalsverteilung innerhalb einer Klasse nicht). Generative Modelle lernen, wie die Daten entstehen, und können daher neue Datenpunkte \\(x \sim p(x)\\) synthetisieren.
  * **[Transfer-Indikator]:** Wenn die Aufgabe rein in Vorhersage/Klassifikation besteht \\(\to\\) *Diskriminativ*. Wenn neue Daten erzeugt, Fehlstellen ergänzt (*Inpainting*) oder Verteilungen gesampelt werden sollen \\(\to\\) *Generativ*.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 4)
  * Goodfellow et al.: *Deep Learning*, Kapitel 13–20, S. 488, 559–560
  * Prince: *Understanding Deep Learning*, Kapitel 14 (*Unsupervised Learning*), S. 269–272

---

### **Karte 4.3: Taxonomie Generativer Modelle: Explicit vs. Implicit Density (Typ II: Dichotomien)**
* **Vorderseite:** Wie unterteilen sich generative Modelle hinsichtlich ihrer Handhabung der Wahrscheinlichkeitsdichte \\(p(x)\\)?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:**
    * *Explicit Density (Traktabel):* Berechnet \\(p(x)\\) exakt (z. B. Autoregressive Modelle, Normalizing Flows).
    * *Explicit Density (Approximativ):* Berechnet eine untere Schranke der Dichte (z. B. Variational Autoencoder via *ELBO*).
    * *Implicit Density:* Modelliert \\(p(x)\\) nicht explizit, sondern lernt einen Transformationsmechanismus \\(x = G(z; \theta)\\), um Daten zu erzeugen (z. B. GANs via Minimax-Spiel \\(\min_G \max_D V(D, G)\\)).
  * **[Semantischer Kern]:** Traktable Dichten ermöglichen direkte Likelihood-Berechnungen. Implizite Modelle verzichten auf die mathematische Dichtebestimmung zugunsten extrem realistischer Stichprobengenerierung durch gegeneinander spielende Netzwerke.
  * **[Transfer-Indikator]:** Wichtig zur Modellauswahl: Wird eine exakte Wahrscheinlichkeit/Dichteschätzung benötigt? \\(\to\\) *Flows/Autoregressiv*. Geht es rein um visuelle Qualität der Generierung? \\(\to\\) *GANs / Diffusion Models*.
* **Quelle(n):**
  * Goodfellow et al.: *Deep Learning*, Kapitel 20 (*Generative Models Taxonomy*), S. 683–685
  * Prince: *Understanding Deep Learning*, Kapitel 14, 15, 17, S. 270–275, 327–330

---

### **Karte 5.1: Maximum Likelihood Estimation (MLE) (Typ III: Argumentations-Muster)**
* **Vorderseite:** Warum ist Maximum Likelihood Estimation (MLE) das fundamentale Rahmenprinzip zur Ableitung von Verlustfunktionen im ML?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Maximierung der gemeinsamen Wahrscheinlichkeit der Trainingsdaten bzw. Minimierung der *Negative Log-Likelihood (NLL)*:
    \\[\theta_{\text{MLE}} = \arg\min_\theta - \sum_{i=1}^N \log p(y^{(i)} | x^{(i)}; \theta)\\]
  * **[Semantischer Kern]:** Unter der Annahme einer Gauß-Verteilung für \\(p(y|x)\\) ergibt die NLL-Minimierung exakt den **Mean Squared Error (MSE)**. Unter der Annahme einer Bernoulli-/Multinoulli-Verteilung ergibt sie die **Cross-Entropy**. MLE ist somit die mathematische Mutterfamilie fast aller Standard-Losses.
  * **[Transfer-Indikator]:** Herleitung von Loss-Funktionen in Prüfungen: Starte immer mit der Wahl einer geeigneten Wahrscheinlichkeitsverteilung \\(p(y|\theta)\\) für die Zielvariable \\(y\\) und wende darauf den negativen Logarithmus an.
* **Quelle(n):**
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.5 (*Maximum Likelihood Estimation*), S. 130–133
  * Prince: *Understanding Deep Learning*, Kapitel 5.1 (*Maximum Likelihood*), S. 56–58

---

### **Karte 5.2: Loss Function vs. Cost Function vs. Objective Function (Typ I: Strukturelle Definition)**
* **Vorderseite:** Worin unterscheiden sich Loss Function, Cost Function und Objective Function mathematisch präzise?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:**
    * *Loss Function \\(\mathcal{L}(\hat{y}^{(i)}, y^{(i)})\\):* Abweichung für ein **einzelnes** Trainingsbeispiel \\(i\\).
    * *Cost Function \\(J(\theta)\\):* Aggregierter mittlerer Fehler über den gesagten Datensatz/Batch:
      \\[J(\theta) = \frac{1}{N} \sum_{i=1}^N \mathcal{L}(f(x^{(i)}; \theta), y^{(i)})\\]
    * *Objective Function:* Die Gesamtzielkoordinate der Optimierung, häufig inklusive Regularisierungsterm: \\(J(\theta) + \lambda \Omega(\theta)\\).
  * **[Semantischer Kern]:** Der Loss bewertet lokale Fehler auf Punkt-Ebene. Die Cost Function summiert diese auf, um den Modellzustand zu bewerten. Die Objective Function ist das globale mathematische Ziel des Optimierers.
  * **[Transfer-Indikator]:** Vermeidung von Begriffsverwirrungen in mathematischen Beweisen und Implementierungen (z.B. PyTorch: `loss` pro Beispiel vs. aggregierter Batch-Loss).
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 5)
  * Goodfellow et al.: *Deep Learning*, Kapitel 4.3 & 8.1, S. 82, 272–273
  * Prince: *Understanding Deep Learning*, Kapitel 2.1, S. 18–19

---

### **Karte 5.3: Stochastischer Gradientenabstieg (SGD) & Mini-Batches (Typ III: Argumentations-Muster)**
* **Vorderseite:** Was ist das Grundprinzip von SGD mit Mini-Batches und warum bevorzugt man es gegenüber dem echten Gradientenabstieg (*Batch GD*)?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Parameterupdate für einen zufälligen Mini-Batch \\(B \subset \{1, \dots, N\}\\) mit Lernrate \\(\eta\\):
    \\[\theta^{(t+1)} = \theta^{(t)} - \eta \cdot \frac{1}{|B|} \sum_{i \in B} \nabla_\theta \mathcal{L}(f(x^{(i)}; \theta^{(t)}), y^{(i)})\\]
  * **[Semantischer Kern]:** Die Berechnung des exakten Gradienten über den gesamten Datensatz (\\(N \to \infty\\)) ist rechentechnisch zu teuer. Mini-Batches liefern einen unverzerrten (*unbiased*), aber rauschbehafteten Schätzwert des Gradienten. Dieses Rauschen hilft dem Optimierer zudem, flachen lokalen Minima und Sattelpunkten zu entkommen.
  * **[Transfer-Indikator]:** Standard-Optimierungsverfahren beim Training von Deep Learning Modellen. Batch-Größe \\(|B|\\) und Lernrate \\(\eta\\) sind die zentralen Optimierungs-Hyperparameter.
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 5)
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.9 & 8.1.3, S. 149–150, 276–278
  * Prince: *Understanding Deep Learning*, Kapitel 6.2 (*Stochastic Gradient Descent*), S. 85–87

---

### **Karte 5.4: Bias-Variance Tradeoff & Generalisierung (Typ II: Dichotomien)**
* **Vorderseite:** Wie zerlegt sich der erwartete Testfehler mathematisch und was bedeuten Bias und Variance für Overfitting/Underfitting?
* **Rückseite (Split-Muster):**
  * **[Formale Struktur]:** Erwarteter quadratischer Fehler eines Schätzers \\(\hat{f}(x)\\):
    \\[\mathbb{E}\left[(y - \hat{f}(x))^2\right] = \text{Bias}\left[\hat{f}(x)\right]^2 + \text{Var}\left[\hat{f}(x)\right] + \sigma^2\\]
    wobei \\(\sigma^2\\) das irreduzible Datenrauschen ist.
  * **[Semantischer Kern]:**
    * *Hoher Bias (Underfitting):* Das Modell ist zu einfach gewählt und verfehlt die zugrundeliegende Struktur (hoher Trainings- und Testfehler).
    * *Hohe Varianz (Overfitting):* Das Modell ist zu komplex und reagiert überempfindlich auf Zufallsschwankungen der Trainingsdaten (geringer Trainingsfehler, hoher Testfehler).
  * **[Transfer-Indikator]:** Diagnoseinstrument im Modelltraining: Wenn \\(E_{\text{train}}\\) hoch \\(\to\\) Modellkapazität erhöhen (Bias reduzieren). Wenn \\(E_{\text{train}}\\) niedrig, aber \\(E_{\text{test}}\\) hoch \\(\to\\) Regularisierung anwenden / mehr Daten sammeln (Varianz reduzieren).
* **Quelle(n):**
  * Note: *KI Grundlagen: Konzepte & Definitionen* (Thema 6 / Vorbereitung)
  * Goodfellow et al.: *Deep Learning*, Kapitel 5.2 & 5.3, S. 108–127
  * Prince: *Understanding Deep Learning*, Kapitel 8.1 (*Bias-Variance Tradeoff*), S. 120–123