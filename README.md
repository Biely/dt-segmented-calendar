## 仿钉钉考勤统计日周月日期选择组件

支持钉钉小程序、支付宝小程序

实现效果:
|![93e365d6260133470379c22006b1960b.jpg](1)|![12d9bd352fe2d9059d19f8411047a0cb.jpg](2)|![f83bf593d37afcd7c1ee56ee02b70296.jpg](3)|
|-|-|-|


使用方法：

下载组件保存至项目compoments文件夹，在page.json文件中引入
page.json

```language
{
  "component": true,
  "usingComponents":{
    ...
    "dt-segmented-calendar": "/compoments/dt-segmented-calendar/src/index"
  }
}
```

page.axml
```language
<dt-segmented-calendar onChange="onChangeCalender">
    <view slot="title">
        <!-- 卡片头部左侧区域 -->
	...
    </view>
    <view slot="content">
	<!-- 日历下方内容区域 -->
	...
    </view>
</dt-segmented-calendar>
```

page.js
```language
//返回时间值为字符串形式
onChangeCalender(calenderInfo) {
      console.log("____________________",calenderInfo)
      //日
      if (calenderInfo.type===1) {
        let day = dayjs(calenderInfo.value, "YYYY-MM-DD")
        this.setData({
          'currentType': 1,
          'searchInfo.startCreatedAt': day.startOf('d').toISOString(),
          'searchInfo.endCreatedAt': day.endOf('d').toISOString()
        })
      }
      //周，返回时间数组
      if (calenderInfo.type === 2) {
        let startDay = dayjs(calenderInfo.value[0], "YYYY-MM-DD")
        let endDay = dayjs(calenderInfo.value[1], "YYYY-MM-DD")
        this.setData({
          'currentType': 2,
          'searchInfo.startCreatedAt': startDay.startOf('d').toISOString(),
          'searchInfo.endCreatedAt': endDay.endOf('d').toISOString()
        })
      }
      //月
      if (calenderInfo.type === 3) {
        let month = dayjs(calenderInfo.value,"YYYY-MM")
        this.setData({
          'currentType': 3,
          'searchInfo.startCreatedAt': month.startOf('M').toISOString(),
          'searchInfo.endCreatedAt': month.endOf('M').toISOString()
        })
      }
    },
```
