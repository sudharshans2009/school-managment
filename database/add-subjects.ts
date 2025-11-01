import { db } from "./index";
import { subjects } from "./schema";

/**
 * Script to add missing subjects for the timetable
 */

const MISSING_SUBJECTS = [
  {
    name: "Computer",
    code: "COMP11",
    description: "Computer Science - Class 11",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "Maths",
    code: "MATH11B",
    description: "Mathematics - Class 11",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "KTPI",
    code: "KTPI11B",
    description: "Knowledge Traditions & Practices of India",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "Yoga",
    code: "YOGA11",
    description: "Yoga - Health & Physical Education",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "Library",
    code: "LIB11",
    description: "Library Period",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "HPE",
    code: "HPE11",
    description: "Health & Physical Education",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "Physics Lab",
    code: "PHYLAB11",
    description: "Physics Laboratory",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "Chemistry Lab",
    code: "CHEMLAB11",
    description: "Chemistry Laboratory",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "V Edu",
    code: "VEDU11",
    description: "Value Education",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
  {
    name: "Bajan",
    code: "BAJAN11",
    description: "Bajan / Prayer",
    applicableGrades: JSON.stringify(["11"]),
    applicableSections: JSON.stringify(["B"]),
  },
];

async function addSubjects() {
  console.log("📚 Adding missing subjects...\n");

  try {
    let addedCount = 0;
    const errors: string[] = [];

    for (const subject of MISSING_SUBJECTS) {
      try {
        // Check if subject already exists
        const existing = await db.query.subjects.findFirst({
          where: (subjects, { eq }) => eq(subjects.name, subject.name),
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${subject.name} (already exists)`);
          continue;
        }

        await db.insert(subjects).values(subject);
        console.log(`✅ Added: ${subject.name} (${subject.code})`);
        addedCount++;
      } catch (error) {
        errors.push(`Failed to add ${subject.name}: ${error}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully added: ${addedCount} subjects`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log("\n✨ Subject addition complete!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
addSubjects()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
