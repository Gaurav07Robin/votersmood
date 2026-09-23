import sys

with open('client/src/pages/Polls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Restore the EngagementSidebar import
import_stmt = "import { PollSkeleton } from '../components/Skeleton';"
new_import = "import { PollSkeleton } from '../components/Skeleton';\nimport EngagementSidebar from '../components/EngagementSidebar';"
if "import EngagementSidebar" not in text:
    text = text.replace(import_stmt, new_import)

# 2. Revert the layout wrapper to the two-column grid
old_grid = "<div style={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%' }}>"
new_grid = "<div className=\"two-column-grid\" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>"
text = text.replace(old_grid, new_grid)

# 3. Add the EngagementSidebar column back to the end of the grid wrapper
if "EngagementSidebar" not in text.split("</Layout>")[0].split(new_grid)[1]:
    # We find the end of the first column which is closing div right before the main wrapper ends
    # Actually, we can just replace the closing tags of the grid.
    # The grid ends right before </div> </Layout>
    search_str = """          </div>

        </div>
      </Layout>"""
    replace_str = """          </div>

          <div>
            <EngagementSidebar />
          </div>

        </div>
      </Layout>"""
    if search_str in text:
        text = text.replace(search_str, replace_str)
    else:
        # Fallback if whitespace differs
        import re
        text = re.sub(r'(\s*</div>\s*</div>\s*</Layout>\s*)$', r'\n          <div>\n            <EngagementSidebar />\n          </div>\n\1', text)

with open('client/src/pages/Polls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated client/src/pages/Polls.jsx")
