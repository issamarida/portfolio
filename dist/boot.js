// The first thing that runs: it puts up the opening title and the temple
// margins straight away, from a small module graph, so a first visit never
// sees the hero half-built. app.js then builds the village behind the title
// and hands it over once everything the hero needs is ready.
import { openIntro, shouldPlayIntro } from "./intro.js";
import { mountPillars } from "./pillars.js";

mountPillars(document.querySelector(".shell"));
if (shouldPlayIntro()) openIntro();
