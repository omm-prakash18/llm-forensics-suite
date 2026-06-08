import re
import numpy as np

def extract_features(text: str) -> dict:
    """
    Extracts comprehensive stylometric, lexical, syntactic, and structural signals from text.
    """
    # Tokenize
    tokens = [word.lower() for word in re.findall(r'\b\w+\b', text)]
    num_tokens = len(tokens)
    if num_tokens == 0:
        return {}

    # 1. Lexical Signals
    num_types = len(set(tokens))
    type_token_ratio = num_types / num_tokens if num_tokens > 0 else 0
    
    avg_word_length = np.mean([len(t) for t in tokens]) if tokens else 0.0
    
    hedging_phrases = [
        "it is worth noting", "importantly", "notably", 
        "it's important to", "it should be noted", "one might argue"
    ]
    text_lower = text.lower()
    hedge_count = sum(text_lower.count(phrase) for phrase in hedging_phrases)
    hedging_rate = (hedge_count / num_tokens) * 100 if num_tokens > 0 else 0

    # 2. Syntactic Signals
    # Improved sentence splitter
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*$', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_lengths = [len(re.findall(r'\b\w+\b', sent)) for sent in sentences]
    
    mean_sentence_length = float(np.mean(sentence_lengths)) if sentence_lengths else 0.0
    std_sentence_length = float(np.std(sentence_lengths)) if sentence_lengths else 0.0
    
    filler_openers = ["here's", "let's", "this is"]
    filler_count = sum(1 for sent in sentences if sent.lower().startswith(tuple(filler_openers)))
    filler_rate = (filler_count / len(sentences)) * 100 if sentences else 0.0

    subordinate_markers = ["which", "although", "however", "whereas", "despite"]
    sub_clause_count = sum(1 for sent in sentences if any(m in sent.lower() for m in subordinate_markers))
    subordinate_clause_ratio = sub_clause_count / len(sentences) if sentences else 0.0

    # 3. Stylometric Signals
    # Em dash rate per 100 words
    em_dash_count = text.count("\u2014") + text.count("--")
    em_dash_rate = (em_dash_count / num_tokens) * 100 if num_tokens > 0 else 0
    
    # Bullet/list density
    bullet_count = len(re.findall(r'^\s*[-*•]\s|^\s*\d+\.\s', text, flags=re.MULTILINE))
    bullet_density = (bullet_count / num_tokens) * 100 if num_tokens > 0 else 0
    
    # Bold/header density
    bold_count = len(re.findall(r'\*\*.*?\*\*', text))
    header_count = len(re.findall(r'^#{1,6}\s', text, flags=re.MULTILINE))
    bold_header_density = ((bold_count + header_count) / num_tokens) * 100 if num_tokens > 0 else 0

    # Oxford comma rate
    oxford_comma_matches = len(re.findall(r',\s+(and|or)\s+', text_lower))
    no_oxford_comma_matches = len(re.findall(r'\w\s+(and|or)\s+', text_lower))
    total_lists = oxford_comma_matches + no_oxford_comma_matches
    oxford_comma_rate = oxford_comma_matches / total_lists if total_lists > 0 else 0.0

    # Parenthetical aside rate
    parenthetical_content = re.findall(r'\(.*?\)', text)
    parenthetical_rate = (len(parenthetical_content) / num_tokens) * 100 if num_tokens > 0 else 0

    # 4. Structural Signals
    # Preamble detection
    preamble_starters = ["sure", "certainly", "okay", "here is", "let me"]
    has_preamble = 1.0 if sentences and (any(sentences[0].lower().startswith(p) for p in preamble_starters) or sentences[0].endswith(':')) else 0.0
    
    has_numbered_steps = 1.0 if re.search(r'^\s*\d+\.\s', text, flags=re.MULTILINE) else 0.0
    
    conclusion_phrases = ["in conclusion", "to summarize", "summary", "overall", "in summary"]
    last_paragraph = text.split('\n\n')[-1].lower() if text.strip() else ""
    has_summary_ending = 1.0 if any(p in last_paragraph for p in conclusion_phrases) else 0.0
    
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    paragraph_count = len(paragraphs)
    avg_paragraph_length = np.mean([len(re.findall(r'\b\w+\b', p)) for p in paragraphs]) if paragraphs else 0.0

    return {
        "type_token_ratio": float(type_token_ratio),
        "avg_word_length": float(avg_word_length),
        "hedging_rate": float(hedging_rate),
        "filler_rate": float(filler_rate),
        "mean_sentence_length": float(mean_sentence_length),
        "std_sentence_length": float(std_sentence_length),
        "subordinate_clause_ratio": float(subordinate_clause_ratio),
        "em_dash_rate": float(em_dash_rate),
        "bullet_density": float(bullet_density),
        "bold_header_density": float(bold_header_density),
        "oxford_comma_rate": float(oxford_comma_rate),
        "parenthetical_rate": float(parenthetical_rate),
        "has_preamble": float(has_preamble),
        "has_numbered_steps": float(has_numbered_steps),
        "has_summary_ending": float(has_summary_ending),
        "paragraph_count": int(paragraph_count),
        "avg_paragraph_length": float(avg_paragraph_length)
    }
