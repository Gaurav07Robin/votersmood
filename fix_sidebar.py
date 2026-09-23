import sys

with open('client/src/pages/Polls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

search_str = """              <CommunityPollsSection openRegisterModal={() => setIsRegisterOpen(true)} />
            </div>
          )}
        </div>

        

      </div>"""

replace_str = """              <CommunityPollsSection openRegisterModal={() => setIsRegisterOpen(true)} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          <EngagementSidebar />
        </div>

      </div>"""

if search_str in text:
    text = text.replace(search_str, replace_str)
    with open('client/src/pages/Polls.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Injected successfully!")
else:
    print("Failed to find exact block")

