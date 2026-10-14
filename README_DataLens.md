# DataLens — See Beyond the Spreadsheet

> Turn raw datasets into clearer, more actionable insights.

DataLens is a browser-based data exploration dashboard designed to help users inspect datasets, understand data quality, discover patterns, and communicate findings through visualizations and reports.

## ✨ Highlights

- **Upload and parse datasets** — work with supported CSV, Excel, and JSON files.
- **Explore dataset health** — review missing values, duplicates, and other data-quality signals.
- **Understand the data** — inspect summary statistics and column-level information.
- **Visualize patterns** — explore data with charts and graphical summaries.
- **Discover insights** — surface useful observations and relationships in a dataset.
- **Clean data** — access data-cleaning workflows for preparing datasets for analysis.
- **Export reports** — generate shareable report outputs where supported by the app.
- **Interactive experience** — animated UI elements and a dashboard organized into focused analysis sections.

> Note: Available results depend on the uploaded file, its structure, and the features implemented in the current build. Validate important findings before using them for business or academic decisions.

## 🧰 Tech Stack

- **React** — component-based user interface
- **TypeScript** — typed application code
- **Vite** — development server and production build
- **Tailwind CSS** — styling utilities
- **Recharts** — data visualizations
- **Papa Parse** — CSV parsing
- **SheetJS (`xlsx`)** — spreadsheet parsing
- **Framer Motion** — interface animations
- **jsPDF / html2canvas** — report-generation utilities

## 🚀 Run Locally

### Prerequisites

- Node.js (LTS recommended)
- npm

### Setup

```bash
# 1. Clone the repository
git clone <your-repository-url>

# 2. Move into the project folder
cd <project-folder>

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🏗️ Production Build

```bash
npm run build
npm run preview
```

To check TypeScript errors:

```bash
npm run typecheck
```

To run lint checks:

```bash
npm run lint
```

## 📁 Project Structure

```text
src/
├── components/
│   ├── charts/          # Chart components
│   ├── dashboard/
│   │   └── pages/       # Dashboard analysis sections
│   ├── landing/          # Landing page and intro visuals
│   └── ui/               # Reusable UI components
├── context/              # Dataset state and shared context
├── lib/                  # Parsing, detection, statistics and analysis helpers
├── types/                # TypeScript types
├── App.tsx
└── main.tsx
```

## 🧭 Typical Workflow

1. Open DataLens.
2. Upload a supported dataset or explore the sample data, if available.
3. Review the dataset overview and quality indicators.
4. Explore statistics, charts, insights, and relationships.
5. Apply available cleaning actions.
6. Export a report if needed, then verify the output before sharing it.

## 🔒 Data & Privacy

DataLens includes client-side data-processing libraries. Do not assume that every part of the app is fully local or that uploaded data is never transmitted without reviewing the implementation and any connected services. Avoid uploading confidential, personal, or sensitive datasets unless you have verified the app's data-handling behavior.

## 🧪 Before Publishing

- [ ] Run `npm run build` and resolve build errors.
- [ ] Test CSV, Excel, and JSON uploads with representative files.
- [ ] Test empty files, malformed data, and large datasets.
- [ ] Verify charts and cleaning actions against known sample data.
- [ ] Test report downloads and exported content.
- [ ] Check mobile and tablet layouts.
- [ ] Replace the default Vite favicon with project branding.
- [ ] Add screenshots or a short demo GIF.
- [ ] Add the deployed demo URL and repository URL below.

## 🔗 Links

- **Live Demo:** _Add your deployed URL_
- **Source Code:** _Add your repository URL_

## 👩‍💻 Project Note

DataLens was prototyped with AI-assisted development using Bolt and is intended as a data-exploration project. Review, test, and understand the code before presenting the app as production-ready or describing individual implementation details in interviews.

## 📄 License

No license has been specified yet. Add a `LICENSE` file before allowing others to reuse or redistribute this project.
