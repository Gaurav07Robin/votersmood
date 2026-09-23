import sys
import re

with open('client/src/components/PostComposer.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the hardcoded topicTag creation logic
old_logic = """      const created = await api.createPost({
        content: content.trim(),
        isOpenQuestion,
        targetLeaderId: isOpenQuestion ? targetScopeId : null,
        targetLeaderName: isOpenQuestion ? targetScopeName : null,
        questionCategory: isOpenQuestion ? questionCategory : null,
        leaderTag: isOpenQuestion ? targetScopeName.toUpperCase() : 'GENERAL FEEDBACK',
        topicTag: 'POLITICALDISCUSSIONS',
      });"""

new_logic = """      // Dynamically extract the first hashtag from the content to use as the topic tag
      const hashtagsMatch = content.trim().match(/#[\\w]+/g);
      const extractedTag = hashtagsMatch ? hashtagsMatch[0].replace('#', '').toUpperCase() : 'GENERAL';

      const created = await api.createPost({
        content: content.trim(),
        isOpenQuestion,
        targetLeaderId: isOpenQuestion ? targetScopeId : null,
        targetLeaderName: isOpenQuestion ? targetScopeName : null,
        questionCategory: isOpenQuestion ? questionCategory : null,
        leaderTag: isOpenQuestion ? targetScopeName.toUpperCase() : 'GENERAL FEEDBACK',
        topicTag: extractedTag,
      });"""

if old_logic in text:
    text = text.replace(old_logic, new_logic)
else:
    print("Could not find old logic block")

with open('client/src/components/PostComposer.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Composer topic tag logic updated")
