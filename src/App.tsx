// Import React hooks and resources
import { useState } from "react"; // For component state
import JSONData from "./data.json"; // JSON-based initial structure of the file explorer
import "./App.css"; // Optional: CSS styles (ensure this file exists to avoid build error)

// ---------- Type Definitions ----------

// This interface defines the structure of each file or folder node in the tree
interface FileNode {
  id: string; // Unique identifier for each node
  name: string; // Display name of the file/folder
  isFolder: boolean; // Flag to differentiate between file and folder
  children?: FileNode[]; // Optional: only folders can have children
}

// This type keeps track of which folder names are expanded in the UI
interface ExpandedState {
  [key: string]: boolean; // Key: folder name, Value: true if expanded, false otherwise
}

// ---------- Tree Sorting Utility ----------

/**
 * Recursively sorts the file tree so that:
 * 1. Folders appear before files
 * 2. Items are listed alphabetically (by name)
 *
 * This helps maintain a clean, user-friendly hierarchy.
 */
const sortFileTree = (nodes: FileNode[]): FileNode[] => {
  return nodes
    .map((node) => ({
      ...node,
      children:
        node.isFolder && node.children
          ? sortFileTree(node.children) // Recursively sort folder contents
          : undefined, // Files or folders without children
    }))
    .sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1; // Folder before file
      if (!a.isFolder && b.isFolder) return 1; // File after folder
      return a.name.localeCompare(b.name); // Alphabetical order
    });
};

// Process initial data from JSON file to ensure it's sorted
const initialData: FileNode[] = sortFileTree(JSONData);

// ---------- Recursive Tree Rendering Component ----------

/**
 * List component: displays a list of nodes (files/folders) recursively
 * Props:
 * - nodes: array of FileNode objects for the current level
 * - addFileOrFolder: callback to add a child node under a folder
 * - deleteHandler: callback to delete a child node under a folder
 */
const List = ({
  nodes,
  addFileOrFolder,
  deleteHandler,
}: {
  nodes: FileNode[];
  addFileOrFolder: (parentId: string) => void;
  deleteHandler: (parentId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState<ExpandedState>({}); // Track expansion state by folder name

  return (
    <ul>
      {nodes.map((node) =>
        node.isFolder ? (
          <li key={node.id}>
            {/* Toggle expansion on clicking "+" or "-" */}
            <span
              className="expand-icon"
              onClick={() =>
                setIsExpanded((prev) => ({
                  ...prev,
                  [node.name]: !isExpanded[node.name], // Toggle expansion state for this folder
                }))
              }
            >
              {isExpanded[node.name] ? "-" : "+"} {/* Show "-" if expanded */}
            </span>

            {/* Folder icon - clicking adds new file/folder under this node */}
            <span onClick={() => addFileOrFolder(node.id)}>📁</span>

            {/* Folder name */}
            <span>{node.name}</span>

            {/* Delete icon = clicking delete file/folder this node */}
            <span onClick={() => deleteHandler(node.id)}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png"
                alt="delete icon"
                className="delete-icon"
              />
            </span>

            {/* Recursively render children if expanded */}
            {isExpanded[node.name] && node.children && (
              <List
                nodes={node.children}
                addFileOrFolder={addFileOrFolder}
                deleteHandler={deleteHandler}
              />
            )}
          </li>
        ) : (
          // Display a file entry
          <li key={node.id}>
            <span>📄</span>
            <span>{node.name}</span>
            <span onClick={() => deleteHandler(node.id)}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png"
                alt="delete icon"
                className="delete-icon"
              />
            </span>
          </li>
        )
      )}
    </ul>
  );
};

// ---------- Main Application Component ----------

function App() {
  // State to hold the entire tree structure
  const [data, setData] = useState<FileNode[]>(initialData);

  /**
   * Adds a new file or folder to a specific folder (identified by parentId)
   * Triggered when user clicks on a 📁 icon.
   */
  const addFileOrFolder = (parentId: string): void => {
    const name = prompt("Enter the name of the file/folder"); // Name prompt
    const type = prompt("Enter the type (file/folder)"); // Type prompt

    if (!name) return; // If name is not provided (cancelled), don't proceed

    // Construct the FileNode object for the new entry
    let entry: FileNode = {
      id: Date.now().toString(), // Generate unique ID based on timestamp
      name, // Safe to assign since we've already checked for null
      isFolder: false, // Default is file
    };

    // If the user entered "folder", create an empty folder instead
    if (type?.toLowerCase() === "folder") {
      entry = {
        id: Date.now().toString(),
        name,
        isFolder: true,
        children: [], // Empty folder initially
      };
    }

    /**
     * Recursive helper function to update the tree
     * - Searches for the node with parentId
     * - Appends the new entry as its child
     */
    const updatedTree = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: node.children ? [...node.children, entry] : [entry], // Add entry to existing or new array
          };
        }

        // Recurse into children if present
        if (node.children) {
          return { ...node, children: updatedTree(node.children) };
        }

        return node; // Base case: return node unchanged
      });
    };

    // Update app state with the modified tree, sorted again to maintain order
    setData((prev) => sortFileTree(updatedTree(prev)));
  };

  /**
   * Delete a file or folder (identified by parentId)
   * Triggered when user clicks on a delete icon.
   */
  const deleteHandler = (parentId: string): void => {
    /**
     * Recursive helper function to update the tree
     * - Searches for the node with parentId
     * - delete the node and its childrens
     */
    const updatedTree = (list: FileNode[]): FileNode[] => {
      return (
        list
          // filter out the file/folder which matches the parent id
          .filter((node) => node.id !== parentId)
          .map((node) => {
            // Recurse into children if present
            if (node.children) {
              return { ...node, children: updatedTree(node.children) };
            }

            return node;
          })
      );
    };
    // Update app state with the modified tree
    setData((prev) => updatedTree(prev));
  };

  return (
    <div className="file-explorer-container">
      <h1>File/Folder Explorers</h1>

      {/* Render tree starting from root */}
      <List
        nodes={data}
        addFileOrFolder={addFileOrFolder}
        deleteHandler={deleteHandler}
      />
    </div>
  );
}

export default App;

// Suggestions for Future Enhancements:

// Feature	Description
// 📝 Rename Node	Add a rename option next to each file/folder.
// ❌ Delete Node	Allow users to delete a file/folder with confirmation.
// 💾 Local Storage	Store and retrieve the tree from localStorage to persist changes.
// 📂 Drag-and-Drop	Add ability to move nodes around the tree.
// ⚙️ Modal Input	Replace prompt() with a modal or form for better UX.
