# Setup Instructions

To see the app in action simply run the following

```bash
npm install
npm run dev
```

The app is built using vite and written in React and Typescript so that should take care of everything.

When the app loads it should present a blank canvas. To use first allocate yourself a number of skill points (although you can continually edit this). Then use the "Add node" button to add as many nodes as you like. These can then be wired together into trees using the target and source handles at the top and bottom respectively. The tree will auto-format as nodes are added and connected. You can unlock a node provided you have enough skill points and all pre-reqs are unlcoked. To unlock a node simply click the button in the bottom right corner. If you want to relock a skill, to recover its skill points, click the button again (this can not be done if the skill is a pre-req to another unlcoked skill). You can edit or delete nodes using the dropdown in the top right of the node. Any changes made here will be accomodated by the tree and skill counter. To search nodes use the input in the top right.

## Completed Bonuses

1. Prevent cycles - completed using isValidConnection callback from React Flow
2. Search and Filter - search bar added to header and all nodes traversed from results to style
3. Functional cost and unlock logic - added logic and ui elements too make interacting with skill tree more stable and funcitonal

## AI Disclosure

Co-pilot was used to seed simple components (e.g. toast, modal, header), common algorithms (e.g. node tree traversal) and tests. These were all the customised to fit the specific requirements of the project. ChatGPT was also used for some general questions but very little was directly copied from there except for maybe some css.

\* The React Flow docs and examples were also used extensively and components were taken from shadcn and Lucide.
