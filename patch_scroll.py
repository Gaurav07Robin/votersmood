import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add scrollRef to state variables
if 'const scrollRef = React.useRef(null);' not in text:
    state_injection = """  const [dropdownOpen, setDropdownOpen] = useState(false);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollBy({ left: e.deltaY, behavior: 'auto' });
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, []);
"""
    text = text.replace("  const [dropdownOpen, setDropdownOpen] = useState(false);", state_injection)

# 2. Attach ref to timeline wrapper
old_timeline_div = '<div className="hide-scroll" style={{ overflowX: \'auto\', overflowY: \'hidden\', paddingBottom: \'32px\', paddingTop: \'10px\', minHeight: \'60px\' }}>'
new_timeline_div = '<div ref={scrollRef} className="hide-scroll" style={{ overflowX: \'auto\', overflowY: \'hidden\', paddingBottom: \'32px\', paddingTop: \'10px\', minHeight: \'60px\' }}>'
text = text.replace(old_timeline_div, new_timeline_div)

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Scroll fix applied!")
