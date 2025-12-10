# LLM-Based SOAP Note Generator & Evaluator

## Project Overview

This application is a specialized tool for healthcare professionals and developers to experiment with GenAI in clinical documentation. It generates SOAP (Subjective, Objective, Assessment, Plan) notes from patient transcripts using multiple Large Language Models (LLMs) simultaneously and evaluates their quality against a "Gold Standard" reference note.

**Live Assessment Purpose**: To demonstrate proficiency in Next.js, API Integration (OpenAI/Gemini), and Advanced Evaluation Techniques (Semantic Similarity/Embeddings).

## Features

- **Multi-Model Support**: Generate notes using OpenAI GPT-4, Google Gemini Pro/Flash (including 1.5), **Locally (T5)**, or **Hugging Face Inference API**.
- **Comprehensive Evaluation**: Metrics for ROUGE-1, ROUGE-L, BLEU, Semantic Similarity (BERTscore proxy), and Length Ratio.
- **Comparison Matrix (Phase 2 Upgrade)**: Detailed comparison table with **visual heatmaps** and "Best Response" highlighting.
- **Cost & Token Estimation**: Real-time estimates for API usage per model.
- **Robust Security**: In-memory IP-based Rate Limiting to prevent API abuse.
- **Local Privacy**: Semantic evaluation runs locally/server-side using `transformers.js` (no data leaks).
- **Premium UI**: Modern glassmorphism design with rich gradients and interactive charts.
- **Advanced Metrics**:
  - **ROUGE-1**: Measures content overlap (Recall).
  - **BLEU**: Measures n-gram precision.
  - **Semantic Similarity**: Uses `Xenova/all-MiniLM-L6-v2` embeddings to measure meaning preservation (BERTscore proxy), ensuring the _intent_ of the note is correct even if wording differs.
- **Interactive Visualizations**: Comparison charts powered by Recharts.
- **Drag-and-Drop Interface**: Easy file uploads for transcripts and reference notes.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + CLSX
- **AI Integration**: `openai`, `@google/generative-ai`
- **Evaluation**: `@xenova/transformers`, `compute-cosine-similarity` (Custom ROUGE/BLEU implementations)
- **Visuals**: `recharts`, `lucide-react`, `framer-motion`

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- API Keys for OpenAI (Optional) and Google Gemini (Required)

### Local Installation

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd llm-based-soap-note-generator-evaluator
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env.local` file in the root:

    ```bash
    cp .env.example .env.local
    ```

    Populate it:

    ```env
    - `OPENAI_API_KEY`: For OpenAI GPT models (Optional)
    ```

- `GEMINI_API_KEY`: For Google Gemini models (Required for Gemini)
- `HF_TOKEN`: For Hugging Face Inference API models (Required for HF Free Inference)

Example `.env.local`:

```bash
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
HF_TOKEN=hf_...
```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000`.

### Testing the App

Two sample files are included in the root directory for immediate testing:

- `sample_transcript.txt`: A conversation between a doctor and patient.
- `sample_reference.txt`: The reference SOAP note for that encounter.

1.  Upload `sample_transcript.txt`.
2.  Upload `sample_reference.txt`.
3.  Select any combination of models (GPT, Gemini, Local, Hugging Face).
4.  Click **Generate Notes**.
5.  View the **Comparison Matrix** to see the winner.

---

## Deployment

### Option A: Vercel (Preferred)

This application is optimized for Vercel.

1.  Push code to GitHub.
2.  Create a new project on [Vercel](https://vercel.com).
3.  Import your repository.
4.  **Important**: Add Environment Variables in the Vercel Project Settings:
    - `GEMINI_API_KEY`
    - `OPENAI_API_KEY`
    - `HF_TOKEN`
5.  Deploy.
    - _Note_: The first build might take a moment as it optimizes the transformers library.
    - _Note_: `@xenova/transformers` runs in a serverless environment but may experience cold starts.

### Option B: Local / Docker

You can build and run locally for production:

```bash
npm run build
npm start
```

---

## Design Considerations & Limitations

- **Free Tier Constraints**:
  - OpenAI API has strict rate limits on free tiers. The app handles errors gracefully but requests may fail if limits are exceeded.
  - Gemini Free Tier has limits (e.g., 60 RPM).
- **Evaluation Performance**:
  - Semantic similarity uses a small, quantized model (`all-MiniLM-L6-v2`) suitable for browser/serverless usage (~30MB). It is a tradeoff between speed and accuracy compared to full BERT models.
- **Next.js 15 & Types**:
  - Some legacy libraries (`rouge`, `bleu-score`) lack Typescript definitions, so custom `d.ts` files were added.
  - Next.js Server Actions were avoided for generation to allow for easier streaming implementation in the future (currently using Route Handlers).

## Licensing

This project is open-source under the MIT License.
