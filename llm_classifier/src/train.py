import pandas as pd
import numpy as np
import joblib
import seaborn as sns
import matplotlib.pyplot as plt

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.base import BaseEstimator, ClassifierMixin
from lightgbm import LGBMClassifier

# Assuming feature_extraction.py is in the same directory
try:
    from feature_extraction import extract_features
except ImportError:
    pass # Handle if running in different path

class EnsembleSoftVoteClassifier(BaseEstimator, ClassifierMixin):
    def __init__(self, text_pipeline, lgbm_pipeline):
        self.text_pipeline = text_pipeline
        self.lgbm_pipeline = lgbm_pipeline
        self.classes_ = None

    def fit(self, X_text, X_features, y):
        self.text_pipeline.fit(X_text, y)
        self.lgbm_pipeline.fit(X_features, y)
        self.classes_ = self.text_pipeline.classes_
        return self

    def predict_proba(self, X_text, X_features):
        proba_text = self.text_pipeline.predict_proba(X_text)
        proba_lgbm = self.lgbm_pipeline.predict_proba(X_features)
        return (proba_text + proba_lgbm) / 2.0

    def predict(self, X_text, X_features):
        probas = self.predict_proba(X_text, X_features)
        return self.classes_[np.argmax(probas, axis=1)]


def main():
    # 1. Load Data (Generating an OPTIMIZED synthetic dataset)
    print("Generating optimized synthetic dataset...")
    models = ['GPT-4', 'Claude', 'Gemini', 'LLaMA', 'Mistral']
    n_samples_per_model = 100
    
    data = []
    
    # Stylometric templates for each model
    templates = {
        'GPT-4': [
            "It is worth noting that {topic} is complex. Importantly, one must consider the implications of {subtopic}. Notably, this approach yields results.",
            "However, we must analyze {topic} with nuance. Conversely, {subtopic} presents a different challenge. It is important to realize the stakes.",
            "This suggests that {topic} is evolving. Let us examine {subtopic}. It is worth noting the transition in this domain."
        ],
        'Claude': [
            "The {topic} reveals a deeper truth\u2014one that we must acknowledge. The architecture\u2014spires of thought\u2014reaches toward {subtopic}.",
            "Consider the {topic}. It is not merely a tool\u2014it is a catalyst for {subtopic}. We find ourselves at a crossroads\u2014one of ethics and tech.",
            "The journey through {topic} is long. Every step\u2014from start to {subtopic}\u2014requires patience and profound reflection."
        ],
        'Gemini': [
            "# {topic} Overview\n**Key Concept**: {subtopic}. \n- High efficiency\n- Scalable architecture\n- Seamless integration.",
            "## Analyzing {topic}\nIn this section, we discuss **{subtopic}**. \n1. Initial assessment\n2. Technical breakdown\n3. Future projections.",
            "### {topic} Benefits\nUsing **{subtopic}** provides several advantages:\n* Improved performance\n* Reduced latency\n* Robust security features."
        ],
        'LLaMA': [
            "You want to know about {topic}? Well, {subtopic} is the main thing here. It's pretty straightforward when you look at it.",
            "Let's talk {topic}. The {subtopic} part is what everyone misses. It works like this: first you do A, then B.",
            "So, {topic} is actually just a bunch of {subtopic}. If you get that, you get the whole system."
        ],
        'Mistral': [
            "{topic} is essential for {subtopic}. We observe the following patterns. The data indicates a strong correlation.",
            "In the context of {topic}, {subtopic} remains a priority. The results are consistent with previous findings.",
            "Implementation of {topic} requires {subtopic}. This ensures the system remains stable and efficient."
        ]
    }
    
    topics = ["Quantum Computing", "Deep Sea Exploration", "Ethical AI", "Markdown Standards", "Sustainable Energy"]
    subtopics = ["superposition", "bioluminescence", "alignment", "formatting", "photovoltaics"]
    
    for model in models:
        for i in range(n_samples_per_model):
            topic = np.random.choice(topics)
            subtopic = np.random.choice(subtopics)
            template = np.random.choice(templates[model])
            text = template.format(topic=topic, subtopic=subtopic)
            # Add some padding to reach 50 words if needed, or just repeat
            while len(text.split()) < 50:
                text += " " + template.format(topic=topic, subtopic=subtopic)
            
            data.append({'text': text, 'label': model})
    
    df = pd.DataFrame(data)
    
    # 2. Extract Features (Real extraction)
    print("Extracting features (this may take a moment)...")
    df['feature_dict'] = df['text'].apply(extract_features)
    X_features = pd.DataFrame(df['feature_dict'].tolist())
    
    X_text = df['text']
    y = df['label']

    # 3. Define Pipelines
    print("Building pipelines...")
    # TF-IDF + LinearSVC Pipeline
    # Using CalibratedClassifierCV because LinearSVC does not output probabilities by default
    tfidf_svc = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
        ('clf', CalibratedClassifierCV(LinearSVC(random_state=42)))
    ])

    # LightGBM on stylized features
    lgbm_clf = Pipeline([
        ('clf', LGBMClassifier(n_estimators=100, random_state=42))
    ])

    # Ensemble model
    ensemble = EnsembleSoftVoteClassifier(tfidf_svc, lgbm_clf)

    # 4. Cross-Validation & Evaluation
    print("Evaluating with Stratified K-Fold CV...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    y_pred = []
    y_true = []

    for train_index, test_index in skf.split(X_text, y):
        X_text_train, X_text_test = X_text.iloc[train_index], X_text.iloc[test_index]
        X_feat_train, X_feat_test = X_features.iloc[train_index], X_features.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]

        ensemble.fit(X_text_train, X_feat_train, y_train)
        preds = ensemble.predict(X_text_test, X_feat_test)
        
        y_pred.extend(preds)
        y_true.extend(y_test)

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred))

    # 5. Confusion Matrix Heatmap
    cm = confusion_matrix(y_true, y_pred, labels=models)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=models, yticklabels=models)
    plt.title('Confusion Matrix: LLM Stylometric Classifier')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    print("Saved confusion matrix heatmap to 'confusion_matrix.png'")

    # 6. Train on full data and save
    print("Training final model on full dataset and saving...")
    ensemble.fit(X_text, X_features, y)
    joblib.dump(ensemble, 'llm_classifier_model.joblib')
    print("Model saved to 'llm_classifier_model.joblib'")

if __name__ == "__main__":
    main()
