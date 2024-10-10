import "./styles.css";
import { useEffect, useState } from "react";
import supabase from "./supabase";

const CATEGORIES = [
  { name: "technology", color: "#007ACC" },
  { name: "science", color: "#2E7D32" },
  { name: "finance", color: "#FF9800" },
  { name: "society", color: "#8A2BE2" },
  { name: "entertainment", color: "#FF00FF" },
  { name: "health", color: "#008080" },
  { name: "history", color: "#795548" },
  { name: "news", color: "#A49A8D" },
];

function App() {
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");

  useEffect(
    function () {
      setIsLoading(true);

      let query = supabase.from("facts").select("*");

      if (currentCategory !== "all") {
        query = query.eq("category", currentCategory);
      }
      async function getFacts() {
        const { data: facts, error } = await query
          .order("votes_interesting", { ascending: false })
          .limit(1000);

        if (!error) setFacts(facts);
        else alert("There was a problem getting data");
        setFacts(facts);

        setIsLoading(false);
      }
      getFacts();
    },
    [currentCategory]
  );
  return (
    <>
      <Header showForm={showForm} setShowForm={setShowForm} />
      {/* use a state variable */}
      {showForm ? (
        <NewFactForm setFacts={setFacts} setShowForm={setShowForm} />
      ) : null}
      <main className="main">
        <CategoryFilter setCurrentCategory={setCurrentCategory} />

        {isLoading ? (
          <Loader />
        ) : (
          <FactList facts={facts} setFacts={setFacts} />
        )}
      </main>
    </>
  );
}

function Loader() {
  return <p className="message">Loading</p>;
}

function Header({ showForm, setShowForm }) {
  const appTitle = "Learn something new today";
  return (
    <header className="header">
      <img
        src="idea-bulb_logo.png"
        height="68"
        width="68"
        alt="Logo for Top Fun Facts"
      />
      <h1 className="site-title">{appTitle}</h1>
      <button
        className="share-button btn-open"
        onClick={() => setShowForm((show) => !show)}
      >
        {showForm ? "Close" : "Share a fact"}
      </button>
    </header>
  );
}

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

function NewFactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState("");
  // Fixed in a video text overlay
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const textLength = text.length;

  async function handleSubmit(e) {
    // prevent browser reload
    e.preventDefault();

    //check if data is valid
    if (text && isValidHttpUrl(source) && category && textLength <= 200) {
      //upload fact to supabase and recieve a new fact object
      const { data: newFact, error } = await supabase
        .from("facts")
        .insert([{ text, source, category }])
        .select();
      setIsUploading(false);
      //add the new fact to the UI
      if (!error) setFacts((facts) => [newFact[0], ...facts]);
      //reset the input fields
      setText("");
      setCategory("");
      setSource("");
      //close the form
      setShowForm(false);
    }
  }
  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
        required
      />
      <span>{200 - textLength}</span>
      <input
        value={source}
        type="text"
        placeholder="Trustworthy source..."
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
        required
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
        required
      >
        <option required value="">
          Choose category:
        </option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-large post-button" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside className="category-aside">
      <ul className="category-list">
        <li className="category">
          <button
            className="category-button"
            style={{ backgroundColor: "black" }}
            onClick={() => setCurrentCategory("all")}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((category) => (
          <li key={category.name} className="category">
            <button
              className="category-button"
              style={{ backgroundColor: category.color }}
              onClick={() => setCurrentCategory(category.name)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts, setFacts }) {
  if (facts.length === 0) {
    return <p className="message">No facts for this category yet</p>;
  }

  return (
    <section className="fact-section">
      <ul className="fact-list">
        {facts.map((fact) => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} />
        ))}
      </ul>
    </section>
  );
}

function Fact({ fact, setFacts }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed =
    fact.votes_interesting + fact.votes_mkay < fact.votes_false;

  async function handleVote(columnName) {
    setIsUpdating(true);
    const { data: updatedFact, error } = await supabase
      .from("facts")
      .update({ [columnName]: fact[columnName] + 1 })
      .eq("id", fact.id)
      .select();
    setIsUpdating(false);

    if (!error)
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
  }

  return (
    <li className="fact-item">
      <p className="fact-text">
        {isDisputed ? <span className="disputed">[⛔️DISPUTED⛔️]</span> : null}

        {fact.text}
      </p>
      <div className="fact-buttons">
        <div className="reactions">
          <button
            className="like-button"
            onClick={() => handleVote("votes_interesting")}
            disabled={isUpdating}
          >
            👍 <strong>{fact.votes_interesting}</strong>
          </button>
          <button
            className="mkay-button"
            onClick={() => handleVote("votes_mkay")}
            disabled={isUpdating}
          >
            🤔 <strong>{fact.votes_mkay}</strong>
          </button>
          <button
            className="false-button"
            onClick={() => handleVote("votes_false")}
            disabled={isUpdating}
          >
            ❌ <strong>{fact.votes_false}</strong>
          </button>
        </div>
        <div className="fact-info">
          <a className="fact-link" href={fact.source}>
            Source
          </a>
          <span
            className="fact-category"
            style={{
              backgroundColor:
                CATEGORIES.find((category) => category.name === fact.category)
                  ?.color || "#ffffff",
            }}
          >
            {fact.category}
          </span>
        </div>
      </div>
    </li>
  );
}

export default App;
