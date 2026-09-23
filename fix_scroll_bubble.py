import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add scrollRef state back
state_injection = """  const [dropdownOpen, setDropdownOpen] = useState(false);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Prevent vertical page scroll when hovering timeline
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault(); // This stops the whole page from scrolling
        el.scrollLeft += e.deltaY; // Scroll horizontally instead
      }
    };
    
    // { passive: false } is REQUIRED so we can call e.preventDefault()
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [currentData]); // Rebind if data changes
"""

text = text.replace("  const [dropdownOpen, setDropdownOpen] = useState(false);", state_injection)

# Replace the div with one that has the ref and no React onWheel
bad_div = """        <div 
          className="hide-scroll" 
          style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px' }}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
               e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >"""

good_div = """        <div 
          ref={scrollRef}
          className="hide-scroll" 
          style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px' }}
        >"""

text = text.replace(bad_div, good_div)

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
