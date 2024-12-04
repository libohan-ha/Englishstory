function App() {
    const [inputValue, setInputValue] = React.useState('');
    const [story, setStory] = React.useState('');
    const [definitions, setDefinitions] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [showStory, setShowStory] = React.useState(true);
    const [words, setWords] = React.useState([]);
    const [showHistory, setShowHistory] = React.useState(false);
    const [history, setHistory] = React.useState([]);
    const [showToast, setShowToast] = React.useState(false);

    // 加载历史记录
    React.useEffect(() => {
        const savedHistory = localStorage.getItem('storyHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        const newWords = e.target.value
            .split(/[\s,]+/)
            .map(word => word.trim())
            .filter(word => word);
        setWords(newWords);
    };

    const removeWord = (wordToRemove) => {
        const newWords = words.filter(word => word !== wordToRemove);
        setWords(newWords);
        setInputValue(newWords.join(' '));
    };

    const playWordAudio = (word) => {
        const audio = new Audio(`http://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`);
        audio.play().catch(error => console.error('播放失败:', error));
    };

    const renderDefinitions = () => {
        if (!definitions) return null;

        return definitions.split('\n').map((line, index) => {
            const match = line.match(/^(\w+)\s+/);
            if (match) {
                const word = match[1];
                return (
                    <div key={index} className="definition-line" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '10px'
                    }}>
                        <button 
                            onClick={() => playWordAudio(word)}
                            className="sound-button"
                            title="点击播放发音"
                        >
                            🔊
                        </button>
                        <span>{line}</span>
                    </div>
                );
            }
            return <div key={index}>{line}</div>;
        });
    };

    // 处理提示框显示
    const showNotification = () => {
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 2000);
    };

    const saveContent = () => {
        const date = new Date();
        const timestamp = date.toLocaleString('zh-CN');
        const newEntry = {
            id: Date.now(),
            timestamp,
            story,
            definitions,
            words: [...words]
        };

        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('storyHistory', JSON.stringify(updatedHistory));
        showNotification();
    };

    const deleteHistoryItem = (id) => {
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        localStorage.setItem('storyHistory', JSON.stringify(updatedHistory));
    };

    const loadHistoryItem = (item) => {
        setStory(item.story);
        setDefinitions(item.definitions);
        setShowHistory(false);
    };

    const generateStory = async () => {
        if (words.length === 0) {
            setError('请先输入一些单词');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            const storyResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-346454e8570d46259a3b4641ec7226cf'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{
                        role: "user",
                        content: `创作一个故事，将以下英文单词巧妙融入中文叙述中：${words.join(', ')}。
严格要求：
# Role: 中英双语故事大师

## Profile
- author: LangGPT Master
- version: 1.0
- language: 中文/英文
- description: 专门创作包含指定英语单词的中文故事，让词汇学习融入生动的中文情境。

## Skills
1. 双语创作
   - 英文单词自然融入
   - 中文表达流畅
   - 语境切换自然
   - 风格多样化

2. 词汇运用
   - 上下文准确
   - 中英搭配合理
   - 使用场景真实
   - 示例地道

3. 故事类型
   - 生活趣事
   - 校园场景
   - 职场故事
   - 日常对话

## Rules
1. 写作规则：
   - 故事主体用中文
   - 指定英文单词需全部使用
   - 单词融入要自然不刻意
   - 确保故事完整有趣

2. 格式要求：
   - 英文单词用斜体标注
   - 单词首次出现无需标注中文
   - 释义统一放在文末
   - 按出现顺序释义

3. 内容标准：
   - 故事简洁生动
   - 情节完整
   - 易于理解
   - 贴近生活

## Workflows
1. 单词分析
   - 理解词义联系
   - 构思适合场景
   - 设计故事线
   - 规划使用顺序

2. 故事创作
   - 用中文构建主体
   - 自然植入单词
   - 保持流畅性
   - 检查使用情况



## OutputFormat
### 故事：
[中文故事正文，英文单词用粗黑体标注]




                    }]
                })
            });

            const storyData = await storyResponse.json();
            setStory(storyData.choices[0].message.content);

            const definitionsResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-346454e8570d46259a3b4641ec7226cf'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{
                        role: "user",
                        content: `为以下英文单词提供中文释义和音标，每行一个，格式为"单词 [音标] : 释义"。音标要准确：${words.join(', ')}`
                    }]
                })
            });

            const definitionsData = await definitionsResponse.json();
            setDefinitions(definitionsData.choices[0].message.content);

            setInputValue('');
            setWords([]);

        } catch (error) {
            console.error('Error:', error);
            setError('生成内容时出错，请稍后重试。' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStoryWithAudio = () => {
        return <div className="story">{story}</div>;
    };

    return (
        <div className="container">
            <div className={`toast-notification ${showToast ? 'show' : ''}`}>
                <span className="icon">✓</span>
                保存成功
            </div>
            <h1>Story Vocabulary</h1>
            <div className="subtitle">输入英语单词，生成包含这些单词的有趣故事</div>
            
            <div className="input-section">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="输入多个单词（用空格或逗号分隔）"
                    className="word-input"
                />
                
                <div className="word-tags">
                    {words.map((word, index) => (
                        <span key={index} className="word-tag">
                            {word}
                            <button 
                                onClick={() => removeWord(word)}
                                className="remove-word"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

            <button 
                onClick={generateStory} 
                disabled={isLoading || words.length === 0}
                className="generate-button"
            >
                {isLoading ? '生成中...' : 'Generate Story'}
            </button>

            {showHistory ? (
                <div className="history-container">
                    <h2>历史记录</h2>
                    {history.length === 0 ? (
                        <p>暂无历史记录</p>
                    ) : (
                        history.map(item => (
                            <div key={item.id} className="history-item">
                                <div className="history-header">
                                    <span className="history-time">{item.timestamp}</span>
                                    <span className="history-words">单词：{item.words.join(', ')}</span>
                                    <div className="history-actions">
                                        <button onClick={() => loadHistoryItem(item)}>查看</button>
                                        <button onClick={() => deleteHistoryItem(item.id)} className="delete-btn">删除</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <button 
                        onClick={() => setShowHistory(false)}
                        className="close-history"
                    >
                        返回
                    </button>
                </div>
            ) : (
                (story || definitions) && (
                    <>
                        <div className="content">
                            {showStory ? (
                                <div className="story">{renderStoryWithAudio()}</div>
                            ) : (
                                <div className="definitions">{renderDefinitions()}</div>
                            )}
                        </div>
                        <div className="tab-buttons">
                            <button 
                                className="tab-button story"
                                onClick={() => setShowStory(true)}
                            >
                                故事
                            </button>
                            <button 
                                className="tab-button definition"
                                onClick={() => setShowStory(false)}
                            >
                                释义
                            </button>
                            <button 
                                className="tab-button save"
                                onClick={saveContent}
                                disabled={!story && !definitions}
                            >
                                保存
                            </button>
                            <button 
                                className="tab-button history"
                                onClick={() => setShowHistory(true)}
                            >
                                历史
                            </button>
                        </div>
                    </>
                )
            )}
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
