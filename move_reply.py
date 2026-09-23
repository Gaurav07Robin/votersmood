import sys

with open('client/src/components/PostCard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I want to replace the outer wrapper of the Action Bar
old_action_bar = """        {/* Action Bar (Reactions + Insights + Share Button) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>"""

new_action_bar = """        {/* Action Bar (Reactions + Insights) */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingTop: '4px' }}>"""

if old_action_bar in text:
    text = text.replace(old_action_bar, new_action_bar)
else:
    print("Could not find old_action_bar")

# Next, we need to remove the closing div of the first block, and the opening div of the second block.
old_mid = """            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Insights Count */}"""

new_mid = """            </button>

            {/* Insights Count */}"""

if old_mid in text:
    text = text.replace(old_mid, new_mid)
else:
    print("Could not find old_mid")

# And there is one less closing div needed at the end of the action bar
old_end = """            </button>
          </div>
        </div>"""

new_end = """            </button>
        </div>"""

if old_end in text:
    text = text.replace(old_end, new_end)
else:
    print("Could not find old_end")

with open('client/src/components/PostCard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("PostCard updated: Reply button moved next to emojis")
